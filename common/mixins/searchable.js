'use strict';

import {forEach} from 'lodash';
import {Client} from 'elasticsearch';

/**
 * @file Use this mixin to index model properties in elasticsearch
 */

module.exports = function(Model, options) {

  const elasticClient = Client({
    host: 'localhost:9200',
    log: 'trace'
  });

  const index = options.targetIndex;
  const doctype = options.documentType;
  const propNames = options.enabledProperties;

  Model.observe('after save', function event(ctx, next) { //Observe any insert/update event on Model
    if (ctx.instance) {
      console.log('searchable');

      // extract indexable properties from model instance
      let document = {};
      forEach(propNames, (propName) => {
        if (typeof ctx.instance[propName] !== 'undefined') {
          document[propName] = ctx.instance[propName];
        }
      });

      const params = {
        index: index,
        type: doctype,
        id: ctx.instance.id,
        body: document
      };

      // index document
      elasticClient.index(params).then(() => {
        console.log('indexed', document);
      }, (err) => {
        console.log(err);
      })
    }
    next();
  });
};
