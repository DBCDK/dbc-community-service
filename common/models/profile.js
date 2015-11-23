'use strict';

import util from 'util';
import crypto from 'crypto';
import config from '../../config'; // eslint-disable-line no-unused-vars
import * as logger from 'dbc-node-logger';

module.exports = function(Profile) {

  Profile.observe('before save', (ctx, next) => {
    if (ctx.isNewInstance) {
      // create verification token
      crypto.randomBytes(64, (err, buf) => {
        ctx.instance.verificationToken = buf && buf.toString('hex');
      });
      logger.info('created verification token', {instance: ctx.instance});
    }
    next();
  });

  Profile.observe('after save', (ctx, next) => {
    // was a new profile created?
    if (ctx.isNewInstance) {
      logger.info('created new profile', {instance: ctx.instance});

      // create confirmation email content
      const baseUrl = ctx.instance.basePath;
      const Email = Profile.app.models.Email;
      const profileInstance = ctx.instance;
      const token = ctx.instance.verificationToken;
      const uid = ctx.instance.id;
      const redirectUrl = '/profile/login';
      const confirmUrl = util.format('http://%s/profile/confirm?uid=%s&token=%s&redirect=%s', baseUrl, uid, token, redirectUrl);
      const emailTemplate = '<p>Klik på linket for at bekræfte din nye brugerprofil:</p><a href=%s> %s </a>';

      // send email
      Email.send({
        to: profileInstance.email,
        from: 'noreply@dbc.dk',
        subject: 'Bekræft ny brugerprofil',
        html: util.format(emailTemplate, confirmUrl, confirmUrl)
      }, (err) => {
        if (err) {
          logger.error('An error happend while sending an email', {error: err, instance: ctx.instance});
          throw err;
        }

        logger.info('verification email was sent', {instance: ctx.instance});
      });
    }
    next();
  });
};
