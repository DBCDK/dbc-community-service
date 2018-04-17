module.exports = function(Resolution) {
  Resolution.observe('before delete', function(ctx, next) {
    Resolution.find(
      {where: ctx.where, include: ['image', 'video']},
      (err, instances) => {
        instances = Array.isArray(instances) ? instances : [instances];
        instances.forEach(instance => {
          if (instance.image) {
            instance.image.destroy();
          }

          if (instance.video) {
            instance.video.destroy();
          }
        });
      }
    );

    next();
  });
};
