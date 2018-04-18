module.exports = function(Model, {include = []}) {
  Model.observe('before delete', function(ctx, next) {
    Model.find({where: ctx.where, include}, (err, instances) => {
      instances = Array.isArray(instances) ? instances : [instances];
      instances.forEach(instance => {
        include.forEach(rel => {
          if (instance[rel]()) {
            instance[rel].destroy();
          }
        });
      });
    });
    next();
  });
};
