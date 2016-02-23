'use strict';

module.exports = function(Resolution) {
  Resolution.observe('before delete', function(ctx, next) {
    Resolution.find({where: ctx.where, include: ['image']}, (err, instances) => {
      instances = Array.isArray(instances) ? instances : [instances];
      instances.forEach((instance) => {
        instance.image.destroy();
      });
    });

    next();
  });
};
