/**
 * Only query deleted Models if requested explicit
 * @param query
 * @returns {*}
 */
function queryDeleted(query) {
  const queryNonDeleted = {markedAsDeleted: false};

  if (!query.deleted && !(query.where && query.where.id)) {
    if (!query.where || Object.keys(query.where).length === 0) {
      query.where = queryNonDeleted;
    }
    else {
      query.where = {and: [query.where, queryNonDeleted]};
    }
  }
  return query;
}

module.exports = function (Model) {

  Model.on('dataSourceAttached', obj => { // eslint-disable-line no-unused-vars

    Model.destroyAll = function softDestroyAll(where, cb) {
      return Model.updateAll(where, {markedAsDeleted: true})
        .then(result => (typeof cb === 'function') ? cb(null, result) : result)
        .catch(error => (typeof cb === 'function') ? cb(error) : Promise.reject(error));
    };

    Model.remove = Model.destroyAll;
    Model.deleteAll = Model.destroyAll;

    Model.destroyById = function softDestroyById(id, cb) {
      return Model.updateAll({[Model.dataSource.idName(Model.modelName)]: id}, {markedAsDeleted: true})
        .then(result => (typeof cb === 'function') ? cb(null, result) : result)
        .catch(error => (typeof cb === 'function') ? cb(error) : Promise.reject(error));
    };

    Model.removeById = Model.destroyById;
    Model.deleteById = Model.destroyById;

    Model.prototype.destroy = function softDestroy(options, cb) {
      const callback = (typeof cb === 'undefined' && typeof options === 'function') ? options : cb;

      return this.updateAttributes({markedAsDeleted: true})
        .then(result => (typeof cb === 'function') ? callback(null, result) : result)
        .catch(error => (typeof cb === 'function') ? callback(error) : Promise.reject(error));
    };

    Model.prototype.remove = Model.prototype.destroy;
    Model.prototype.delete = Model.prototype.destroy;


    const _find = Model.find;
    Model.find = function findDeleted(query = {}, ...rest) {
      return _find.call(Model, queryDeleted(query), ...rest);
    };

    const _findOrCreate = Model.findOrCreate;
    Model.findOrCreate = function findOrCreateDeleted(query = {}, ...rest) {
      return _findOrCreate.call(Model, queryDeleted(query), ...rest);
    };
  });
};
