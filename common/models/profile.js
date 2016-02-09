'use strict';

import * as logger from 'dbc-node-logger';

module.exports = function (Profile) {

  Profile.observe('before save', (ctx, next) => {
    if (ctx.isNewInstance) {
      // set model properties
      // ctx.instance.email = 'bla';
    }
    next();
  });

  Profile.observe('after save', (ctx, next) => {
    // was a new profile created?
    if (ctx.isNewInstance) {
      logger.info('created new profile', {instance: ctx.instance});

      Profile.app.models.CommunityRole.findById(1, (err, instance) => {
        ctx.instance.communityRoles.add(instance, (err) => {
          if (err !== null) {
            logger.info('could not assign role:', err);
          }
        });
      });
    }
    next();
  });

  Profile.observe('loaded', (ctx, next) => {
    next();
  });
};
