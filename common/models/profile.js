import util from 'util';
import crypto from 'crypto';

module.exports = function (Profile) {

  Profile.observe('before save', function (ctx, next) {
    if (ctx.isNewInstance) {
      // create verification token
      crypto.randomBytes(64, (err, buf) => {
        crypto.randomBytes(64, (err, buf) => {
          ctx.instance.verificationToken = buf && buf.toString('hex');
        });
        next();
      });
    } else {
      next();
    }
  });

  Profile.observe('after save', function (ctx, next) {
    // was a new profile created?
    if (ctx.isNewInstance) {
      // create confirmation email content
      let Email = Profile.app.models.Email;
      let profileInstance = ctx.instance;
      let token = ctx.instance.verificationToken;
      let uid = ctx.instance.id;
      let redirectUrl = '/login';
      //let confirmUrl = util.format('http://127.0.0.1:3000/api/Profiles/confirm?uid=%s&token=%s&redirect=%s', uid, token, redirectUrl);
      let confirmUrl = util.format('http://127.0.0.1:8080/confirm?uid=%s&token=%s&redirect=%s', uid, token, redirectUrl);
      let emailTemplate = '<p>Klik på linket for at bekræfte din nye brugerprofil:</p><a href=%s></a>';

      // send email
      Email.send({
        to: profileInstance.email,
        from: 'ux-matias@dbc.dk',
        subject: 'Bekræft ny brugerprofil',
        html: util.format(emailTemplate, confirmUrl, confirmUrl),
      }, function (err, mail) {
        if (err) {
          throw err;
        }
      });
    }
    next();
  });

};
