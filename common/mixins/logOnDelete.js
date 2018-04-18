module.exports = function LogOnDelete(Model) {
  Model.observe('before delete', (ctx, next) => {
    Model.findOne({where: ctx.where}, (err, instance) => {
      if (err) {
        return next(err);
      }
      if (instance) {
        const logger = Model.app.get('logger');
        logger.info(`Deleted ${ctx.Model.modelName}`, {
          instance: instance
        });
      }
      next();
    });
  });
};
