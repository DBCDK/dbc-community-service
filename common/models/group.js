/**
 * Only query deleted Groups if requested explicit
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

module.exports = function (Group) {

  Group.observe('after save', function afterGroupSave(ctx, next) {
    const logger = Group.app.get('logger');
    Group.app.models.Post.updateAll(
      {
        groupid: ctx.instance.id
      },
      {
        groupDeleted: ctx.instance.markedAsDeleted || false
      }, function (err) {
        if (err) {
          logger.error('An error occurred during group after save updating posts', {error: err});
          next(err);
        }
        else {
          next();
        }
      }
    );
  });

  Group.on('dataSourceAttached', function initSoftDestroyOnGroup() {

    Group.destroyById = function softDestroyById(id, cb) {
      return Group.upsert({id: id, markedAsDeleted: true})
        .then(result => (typeof cb === 'function') ? cb(null, result) : result)
        .catch(error => (typeof cb === 'function') ? cb(error) : Promise.reject(error));
    };

    Group.removeById = Group.destroyById;
    Group.deleteById = Group.destroyById;

    Group.prototype.destroy = function softDestroy(options, cb) {
      const callback = (typeof cb === 'undefined' && typeof options === 'function') ? options : cb;

      return this.updateAttributes({markedAsDeleted: true})
        .then(result => (typeof cb === 'function') ? callback(null, result) : result)
        .catch(error => (typeof cb === 'function') ? callback(error) : Promise.reject(error));
    };

    Group.prototype.remove = Group.prototype.destroy;
    Group.prototype.delete = Group.prototype.destroy;

    const _find = Group.find;
    Group.find = function findDeleted(query = {}, ...rest) {
      return _find.call(Group, queryDeleted(query), ...rest);
    };

    const _findOrCreate = Group.findOrCreate;
    Group.findOrCreate = function findOrCreateDeleted(query = {}, ...rest) {
      return _findOrCreate.call(Group, queryDeleted(query), ...rest);
    };
  });
};
