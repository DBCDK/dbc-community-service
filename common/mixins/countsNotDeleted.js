module.exports = function CountsNotDeleted(Model) {
  function extractRelationCounts(ctx) {
    if (!ctx.args || !ctx.args.filter) {
      return [];
    }
    var filter = JSON.parse(ctx.args.filter);
    var relations = filter && filter.counts;
    if (!Array.isArray(relations)) {
      relations = [relations];
    }
    return relations.filter(function(relation) {
      return (
        Model.relations[relation] &&
        Model.relations[relation].type.startsWith('has')
      );
    });
  }

  function fillCounts(relations, resources) {
    return Promise.all(
      resources.map(function(resource) {
        return Promise.all(
          relations.map(function(relation) {
            return resource[relation]
              .getAsync({markedAsDeleted: null})
              .then(function(elements) {
                var count = 0;
                elements.forEach(element => {
                  if (element.markedAsDeleted !== true) {
                    count += 1;
                  }
                });
                resource[relation + 'Count'] = count;
              });
          })
        );
      })
    );
  }

  function injectCounts(ctx, unused, next) {
    var relations = extractRelationCounts(ctx);
    var resources = ctx.result;
    if (!Array.isArray(resources)) {
      resources = [resources];
    }
    if (!relations.length || !resources.length) {
      return next();
    }

    fillCounts(relations, resources).then(
      function() {
        return next();
      },
      function() {
        return next();
      }
    );
  }

  Model.afterRemote('findById', injectCounts);
  Model.afterRemote('findOne', injectCounts);
  Model.afterRemote('find', injectCounts);
};
