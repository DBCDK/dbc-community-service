'use strict';

import util from 'util';
import crypto from 'crypto';
import config from '../../config'; // eslint-disable-line no-unused-vars
import winston from 'winston';

module.exports = function(Profile) {

  Profile.observe('before save', (context, next) => {
    if (context.isNewInstance) {
      // create verification token
      crypto.randomBytes(64, (err, buf) => {
        context.instance.verificationToken = buf && buf.toString('hex');
      });
      winston.info('created verification token');
    }
    next();
  });

  Profile.observe('after save', (context, next) => {
    // was a new profile created?
    if (context.isNewInstance) {
      winston.info('created new profile');
      winston.info('ctx.instance: ', context.instance);
      // create confirmation email content
      const baseUrl = context.instance.basePath;
      const Email = Profile.app.models.Email;
      const profileInstance = context.instance;
      const token = context.instance.verificationToken;
      const uid = context.instance.id;
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
          throw err;
        }
        winston.info('verification email was sent');
      });
    }
    next();
  });
};
