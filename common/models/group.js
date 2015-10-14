'use strict';

module.exports = function(Group) { // eslint-disable-line no-unused-vars

  Group.observe('before save', function (ctx, next) {
    if (ctx.isNewInstance) {
      next();
    }
    else if (ctx.data.ownerId === ctx.currentInstance.groupownerid) {
      // only let owners edit groups
      next();
    }
  });

};
