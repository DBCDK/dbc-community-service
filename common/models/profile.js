'use strict';

import util from 'util';
import crypto from 'crypto';
import config from '../../config';
import winston from 'winston';


module.exports = function (Profile) {

  Profile.observe('before save', function (ctx, next) {
    if (ctx.isNewInstance) {
      // create verification token
      crypto.randomBytes(64, (err, buf) => {
        ctx.instance.verificationToken = buf && buf.toString('hex');
      });
      winston.info('created verification token');
    }
    next();
  });

  Profile.observe('after save', function (ctx, next) {
    // was a new profile created?
    if (ctx.isNewInstance) {
      winston.info('created new profile');
      // create confirmation email content
      let baseUrl = config.pgUrl;
      let Email = Profile.app.models.Email;
      let profileInstance = ctx.instance;
      let token = ctx.instance.verificationToken;
      let uid = ctx.instance.id;
      let redirectUrl = '/login';
      let confirmUrl = util.format('http://%s/confirm?uid=%s&token=%s&redirect=%s', baseUrl, uid, token, redirectUrl);
      let emailTemplate = '<p>Klik på linket for at bekræfte din nye brugerprofil:</p><a href=%s></a>';

      // send email
      Email.send({
        to: profileInstance.email,
        from: 'ux-matias@dbc.dk',
        subject: 'Bekræft ny brugerprofil',
        html: util.format(emailTemplate, confirmUrl, confirmUrl)
      }, function (err) {
        if (err) {
          throw err;
        }
        winston.info('verification email was sent');
      });
    }
    next();
  });
};
