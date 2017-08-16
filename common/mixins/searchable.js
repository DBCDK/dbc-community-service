

import {eachSeries} from 'async';
import {Client} from 'elasticsearch';
import ProxyAgent from 'proxy-agent';

let config;
try {
  config = require('@dbcdk/biblo-config').config;
}
catch (err) {
  config = require('config');
}

/* eslint-disable no-use-before-define */

/**
 * @file Use this mixin to index model properties and related items in elasticsearch
 *
 * model.json example:
 *
 * "mixins": {
 *  "Searchable": {
 *    "targetIndex": "user", // must be lowercase
 *    "documentType": "user", // must be lowercase
 *    "enabledProperties": [
 *      "email",
 *      "username"
 *    ],
 *    "filter": {
 *      "include": ["roles"]
 *    },
 *    "triggers": [{"modelName":"CommunityRole", "modelFkField": "profileId"}]
 *  }
 *},
 *
 */

// Check if we even want elastic enabled
const ELASTIC_ENABLED = config.get('CommunityService.elasticSearch.enabled');

// Check what host we want to run on
const ELASTIC_HOST = config.get('CommunityService.elasticSearch.host');

// Check the index name (this is the middle part of the index), we want. Use this to avoid document collisions.
const ELASTIC_INDEXNAME = config.get('CommunityService.elasticSearch.indexName');

// Set to 1 to check for missing documents.
const FORCE_INITIAL_INDEX = !!process.env.ELASTIC_FORCE_INDEX_ON_INIT; // eslint-disable-line no-process-env

/**
 * A helper function to map loopback types to elastic search types.
 * @param {*} type
 * @returns {type: string, ...*}
 */
function loopbackToElasticDatatype(type) {
  switch (type) {
    case 'string': {
      return {
        index: true,
        omit_norms: true,
        store: true,
        type: 'text',
        fields: {
          raw: {
            ignore_above: 256,
            index: 'not_analyzed',
            type: 'string'
          }
        }
      };
    }

    case 'number': {
      return {type: 'integer'};
    }

    case 'date': {
      return {type: 'date', format: 'dateOptionalTime'};
    }

    case 'object': {
      return {
        dynamic: true,
        properties: {}
      };
    }

    default: {
      return {type: 'text'};
    }
  }
}

module.exports = function (Model, options) {
  // Give the user an error if elastic is not enabled
  // Better to keep the API consistent across configurations.
  Model.search = function (q, fields, limit, from, sort, next) {
    next('Elastic search is not enabled! Please configure it!');
  };

  // Give error if elastic is not enabled.
  Model.suggest = function (q, next) {
    next('Elastic search is not enabled! Please configure it!');
  };

  // Check if we want elastic enabled
  if (ELASTIC_ENABLED) {
    // The index we want to write to.
    const index = `biblo-${ELASTIC_INDEXNAME}-${options.targetIndex}`;

    // the document type for elastic
    const doctype = options.documentType;

    // The props we want to index
    const propNames = options.enabledProperties;

    // The prop we want suggestions on
    const suggestionProperty = options.suggestionProperty;
    const suggestionField = `${suggestionProperty}_suggest`;

    // The loopback filter to apply to all queries, use this to get relations indexed, or exclude items from the index.
    const filter = options.filter;

    // set these to create listeners on other models, which can trigger reindexing of documents in this model.
    const triggers = options.triggers;

    // Dummy logger before it gets set.
    let logger = {};

    // We need an instance of app to create the triggers, and set the logger
    Model.getApp((err, app) => {
      logger = app.get('logger');

      if (triggers && triggers.length > 0) {
        // Wait for the app to initialize...
        setTimeout(() => {
          triggers.forEach((trigger) => {
            const modelName = trigger.modelName;
            const modelFkField = trigger.modelFkField;

            // Check that the model exists
            if (typeof app.models[modelName] !== 'undefined') {

              // If an instance of a model is deleted, check its foreign key
              // and reindex the element(s) it points to
              app.models[modelName].observe('after delete', (ctx, next) => {
                next();
                if (ctx.where && ctx.where[modelFkField]) {
                  // Create a filter to get the relevant object.
                  let currentFilter = Object.assign({}, filter);
                  currentFilter.where = Object.assign(currentFilter.where || {}, {id: ctx.where[modelFkField]});
                  Model.find(currentFilter, (err2, found) => {

                    if (err2) {
                      return;
                    }

                    // Index all relevant items.
                    found.forEach(instance => {
                      // extract indexable properties from model instance
                      const params = createDocument(instance);

                      elasticClient.index(params, (err3) => {
                        if (err3) {
                          logger.error('Could index object!', {error: err3});
                        }
                      });
                    });
                  });
                }
              });

              // Set an observer on that model.
              app.models[modelName].observe('after save', (ctx, next) => {
                // No need to block other actions, we're not mutating.
                next();

                // Check that we have an instance, and that instance has our foreign key defined.
                if (ctx.instance && ctx.instance[modelFkField]) {

                  // Create a filter to get the relevant object.
                  let currentFilter = Object.assign({}, filter);
                  currentFilter.where = Object.assign(currentFilter.where || {}, {id: ctx.instance[modelFkField]});
                  Model.find(currentFilter, (err2, found) => {
                    if (err2) {
                      return;
                    }

                    // Index all relevant items.
                    found.forEach(instance => {
                      // extract indexable properties from model instance
                      const params = createDocument(instance);

                      elasticClient.index(params, (err3) => {
                        if (err3) {
                          logger.error('Could index object!', {error: err3});
                        }
                      });
                    });
                  });
                }

              });
            }
          });
        }, 200);
      }
    });

    // Create a connection to elastic search.
    let elasticConfig = {
      log: 'error',
      apiVersion: '5.0',
      suggestCompression: true,
      host: ELASTIC_HOST
    };

    if (process.env.http_proxy) { // eslint-disable-line no-process-env
      elasticConfig.createNodeAgent = () => {
        return ProxyAgent(process.env.http_proxy); // eslint-disable-line no-process-env
      };
    }

    const elasticClient = Client(elasticConfig);
    const createRegex = /create/i;

    /**
     * This is a helper function to create a document for elastic.
     * @param {Object} instance - an instance of the current Model.
     * @returns {{index: string, type: string, id: number, body: PlainObject}}
     */
    function createDocument(instance) { // eslint-disable-line no-inner-declarations
      /**
       * This function check the properties of an instance against the props we want, and creates a plain object from it.
       * Please note its a recursive function, so it might run wild given very deep objects.
       * @param {Object} obj
       * @param {Array} props
       * @returns {PlainObject}
       */
      function checkProps(obj, props) {
        let doc = {};
        props.forEach((propName) => {
          if (typeof obj[propName] !== 'undefined') {
            switch (typeof obj[propName]) {
              // If it's a function, it's typically an internal method by loopback for lazy loading
              // We evaluate it to get the result.
              case 'function': {
                doc[propName] = obj[propName]();
                break;
              }

              case 'object': {
                // Is the object a date/time?
                // If so, convert it to a string and let elastic take care of it.
                if (obj[propName] instanceof Date) {
                  if (createRegex.test(propName)) {
                    doc.ES_Timestamp = obj[propName].toISOString();
                  }

                  doc[propName] = obj[propName].toISOString();
                  break;
                }

                // Is the object an array?
                // If so, iterate over it checking the props.
                if (Array.isArray(obj[propName])) {
                  doc[propName] = obj[propName].map(
                    itm => (!!itm) && (itm.constructor === Object) ? checkProps(itm, Object.keys(itm)) : itm
                  );
                  break;
                }

                // Is it null or a plain object?
                // Check the props.
                doc[propName] = obj[propName] && checkProps(obj[propName], Object.keys(obj[propName]));
                break;
              }

              // Mostly just strings and numbers
              // let elastic handle it.
              default: {
                doc[propName] = obj[propName];
              }
            }
          }
        });

        if (typeof Model.beforeIndex === 'function') {
          Model.beforeIndex(instance, doc);
        }

        return doc;
      }

      // Create the document
      let document = checkProps(instance, propNames);

      // Attach a suggester if it's configured.
      if (suggestionProperty && typeof instance[suggestionProperty] !== 'undefined') {
        document[suggestionField] = instance[suggestionProperty];
      }

      return {
        index: index,
        type: doctype,
        id: instance.id,
        body: document
      };
    }

    // This promise creates the initial mapping of datatypes.
    (new Promise((resolve) => {
      if (propNames && Array.isArray(propNames)) {
        // We want to ensure we always have the id of a model.
        if (propNames.indexOf('id') < 0) {
          propNames.push('id');
        }

        // We check if the indice exists, so we only try to create it when needed.
        elasticClient.indices.exists({index}, (err, res) => {
          // if this is true, the indice does not exist, so we create it :)
          if (!err && !res) {
            let elasticModel = {
              ES_Timestamp: {type: 'date', format: 'dateOptionalTime'}
            };

            // We want to map the property types from the loopback model to elastic types.
            // Check if the property is defined (its not if its a relation for example),
            // then check what type it is.
            const mProps = Model.definition.rawProperties;
            propNames.forEach((pName) => {
              if (mProps.hasOwnProperty(pName)) {
                let dataType = mProps[pName].type;

                if (typeof dataType !== 'string' && mProps[pName].hasOwnProperty(pName)) {
                  dataType = typeof mProps[pName][pName];
                }

                elasticModel[pName] = loopbackToElasticDatatype(dataType);
              }
            });

            // If the suggester is enabled, we want that in the mapping as well.
            if (suggestionProperty && mProps.hasOwnProperty(suggestionProperty)) {
              elasticModel[suggestionField] = {
                type: 'completion',
                analyzer: 'standard'
              };
            }

            // Set the mapping as a dynamic one to allow for future manipulation.
            let elasticIndiceCreateBody = {mappings: {}};
            elasticIndiceCreateBody.mappings[doctype] = {
              dynamic: true,
              properties: elasticModel
            };

            // Create the indices
            elasticClient.indices.create({
              index,
              body: elasticIndiceCreateBody
            }, (err2) => {
              if (err2) {
                logger.error('Could not create elastic search indice!');
              }

              resolve();
            });
          }
          else {
            resolve();
          }
        });
      }
      else {
        resolve();
      }
    })).then(() => {
      // Now we're sure we have a mapping, we want to check the data we have against the data in the elastic.
      elasticClient.count({index}, (err, response) => {
        if (err) {
          return Promise.reject(err);
        }

        if (!response) {
          return Promise.reject('No response from elastic!');
        }

        const elasticCount = response.count;

        Model.count((error, modelCount) => {
          if (elasticCount < modelCount || FORCE_INITIAL_INDEX) {
            // Turns out we really want to index, or there's a difference between what's in elastic, and what we have.
            Model.find(filter || {}, (err2, objects) => {
              if (elasticCount < objects.length || FORCE_INITIAL_INDEX) {
                // We use async here to ensure we only insert one document at a time without putting too much strain on the server.
                eachSeries(objects, (item, done) => {
                  // Check if the current doc is found in elastic, if not, index it!
                  elasticClient.exists({
                    index,
                    type: doctype,
                    id: item.id
                  }, (error2, documentExists) => {
                    if (!documentExists) {
                      elasticClient.index(createDocument(item), (err3) => {
                        if (err3) {
                          logger.error('Could index object!', {error: err3});
                        }

                        done();
                      });
                    }
                    else {
                      done();
                    }
                  });
                });
              }
            });
          }
        });
      });
    }).catch(err => {
      let error = err.message ? err.message : err;
      logger.error('An error occurred while checking elastic indexes!', {error: JSON.stringify(error)});
    });

    // Observe any insert/update event on Model
    // Index or reindex anything saved.
    Model.observe('after save', function event(ctx, next) {
      // First we need an array of instances to manipulate.
      (new Promise((resolve, reject) => {
        // If we have only modified on instance, and havn't defined a filter, we just use that object.
        if (ctx.instance && !filter) {
          resolve([ctx.instance]);
        }
        // If we have a single instance, and a filter, we need to get it again to apply the filter and see if we still want to use it.
        else if (ctx.instance) {
          let currentFilter = Object.assign({}, filter);
          currentFilter.where = Object.assign(currentFilter.where || {}, {id: ctx.instance.id});
          Model.find(currentFilter, (err, foundInstances) => {
            if (err) {
              reject(err);
            }
            else {
              resolve(foundInstances);
            }
          });
        }
        // Finally we must have modified a bunch of items, in which case we need to get them with the filter.
        else {
          let currentFilter = Object.assign({}, filter);
          currentFilter.where = Object.assign(currentFilter.where || {}, ctx.where, ctx.data);
          Model.find(currentFilter, (err, foundInstances) => {
            if (err) {
              reject(err);
            }
            else {
              resolve(foundInstances);
            }
          });
        }
      })).then(instances => {
        // We can now upsert the updated instance.
        // Ensure we always have an array, even if no data is present.
        instances = instances || [];
        instances = Array.isArray(instances) ? instances : [instances];
        instances.forEach(instance => {
          // extract indexable properties from model instance
          const params = createDocument(instance);

          elasticClient.index(params, (err) => {
            if (err) {
              logger.error('Could index object!', {error: err});
            }
          });
        });
      });

      next();
    });

    // If something is removed from loopback, we want to remove it from elastic.
    Model.observe('after delete', function (ctx, next) {
      if (ctx && ctx.where && ctx.where.id) {
        // remove entry from elastic.
        elasticClient.delete({
          index,
          type: doctype,
          id: ctx.where.id
        }, (err) => {
          if (err) {
            logger.error('Could delete document!', err);
          }
        });
      }

      next();
    });

    /**
     * The actual search endpoint, a limited proxy to elastics search.
     * @param {String} q - text query.
     * @param {Array} fields - An array of fields we want to query on, in case we don't want to search the entire document.
     * @param {Number} limit - Limit is mostly used for pagination, to avoid excessive return sizes
     * @param {Number} from - From is an offset in items, also used for pagination.
     * @param {Number} sort - field to sort on. ex: 'rating:asc'.
     * @param {function} next - callback from loopback.
     */
    Model.search = function queryElastic(q, fields, limit, from, sort, next) {
      let params = {
        index,
        size: limit || 15,
        from: from || 0,
        sort: sort
      };

      // If we have fields, we want to use a different query type
      if (fields && fields.length > 0) {
        params.body = {query: {multi_match: {query: q, fields: []}}};
        fields.forEach((field) => params.body.query.multi_match.fields.push(field));
      }
      else {
        try {
          const query = JSON.parse(q);
          params.body = query;
        }
        catch (e) {
          params.q = q;
        }
      }

      // Hit elastic with the search!
      elasticClient.search(params, (err, res) => {
        if (err) {
          return next(err);
        }

        // If the model has a afterSearch function, we want to let it sort the results
        if (res && typeof Model.afterSearch === 'function') {
          res = Model.afterSearch(params, res);
        }
        // Otherwise we just want to return the hits.
        else if (res) {
          res = res.hits;
        }

        return next(null, res);
      });
    };

    if (suggestionProperty) {
      // The suggest (completion) endpoint, only works if the properties are set.
      Model.suggest = function elasticSuggest(q, next) {
        elasticClient.suggest({
          index,
          body: {
            suggestions: {
              text: q,
              completion: {
                field: suggestionField
              }
            }
          }
        }, (error, results) => next(error || null, results && results.suggestions && results.suggestions[0]));
      };
    }
  }

  // Hook the search into the loopback model as a remote method.
  Model.remoteMethod(
    'search',
    {
      description: 'Searches via elastic search',
      accepts: [
        {arg: 'q', type: 'string', required: true, description: 'URI search string'},
        {
          arg: 'fields',
          type: 'array',
          required: false,
          description: 'Array of string containing fields to match on. Defaults to all fields.'
        },
        {arg: 'limit', type: 'number', required: false, description: 'How many items to retrieve. Default: 15'},
        {arg: 'from', type: 'number', required: false, description: 'The starting index of hits to return. Default: 0'},
        {arg: 'sort', type: 'string', required: false, description: 'Field to sort on. Ex: "rating:asc".'}
      ],
      returns: {
        arg: 'results', type: 'object', root: true
      },
      http: {path: '/search', verb: 'get'}
    }
  );

  // Hook the suggest into the loopback model as a remote method.
  Model.remoteMethod(
    'suggest',
    {
      description: 'Suggestions via elastic search',
      accepts: [
        {arg: 'q', type: 'string', required: true, description: 'String to suggest upon'}
      ],
      returns: {
        arg: 'results', type: 'object', root: true
      },
      http: {path: '/suggest', verb: 'get'}
    }
  );
};
