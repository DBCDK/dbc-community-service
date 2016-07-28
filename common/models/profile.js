

import * as logger from 'dbc-node-logger';
import crypto from 'crypto';

let uniloginSecret;

if (process.env.UNILOGINSECRET) {
  uniloginSecret = process.env.UNILOGINSECRET;
}
else {
  uniloginSecret = require('@dbcdk/biblo-config').biblo.getConfig().unilogin.secret;
}

module.exports = function(Profile) {
  Profile.prototype.createAccessToken = function(ttl, cb) {
    this.accessTokens.create({
      ttl: ttl
    }, cb);
  };

  /**
   * Method to authenticate a user from unilogin.
   * @param username: The users unilogin username
   * @param timestamp: the unilogin timestamp
   * @param authtoken: The unilogin token
   * @param ttl: The ttl of the auth token
   * @param cb: loopback callback
   */
  Profile.unilogin = (username, timestamp, authtoken, ttl, cb) => {
    let err;
    if (!username) {
      err = new Error('Username is required!');
    }

    if (!timestamp) {
      err = new Error('The unilogin tickets timestamp is required!');
    }

    if (!authtoken) {
      err = new Error('The unilogin tickets token is required!');
    }

    ttl = ttl || 30000000;

    if (err) {
      err.statusCode = 400;
      return cb(err);
    }

    let serverToken = crypto
      .createHash('md5')
      .update(timestamp + uniloginSecret + username)
      .digest('hex');

    if (serverToken !== authtoken) {
      err = new Error('Invalid token!');
      err.statusCode = 403;
      return cb(err);
    }

    // user is now authenticated
    Profile.findOne({where: {username: {regexp: '/^' + username + '$/i'}}}, function(err1, profile) {
      let defaultError = new Error('login failed');
      defaultError.statusCode = 401;
      defaultError.code = 'LOGIN_FAILED';

      if (err1) {
        return cb(defaultError);
      }
      else if (profile) {
        profile.createAccessToken(ttl, (error, accessToken) => {
          if (error) {
            return cb(error);
          }

          accessToken.__data.profile = profile;
          cb(null, accessToken);
        });
      }
      else {
        err = new Error('User does not exist!');
        err.statusCode = 404;
        return cb(err);
      }
    });
  };

  Profile.logout = (tokenId, cb) => {
    this.relations.accessTokens.modelTo.findById(tokenId, function(err, accessToken) {
      if (err) {
        cb(err);
      }
      else if (accessToken) {
        accessToken.destroy(cb);
      }
      else {
        cb(new Error('could not find accesstoken'));
      }
    });
  };

  Profile.checkIfUserExists = (username, cb) => {
    Profile.count({username: {regexp: '^' + username + '$/i'}}, (err, items) => {
      if (err) {
        cb(err);
      }
      else {
        cb(null, {
          username: username,
          exists: items > 0
        });
      }
    });
  };

  Profile.checkIfDisplayNameIsTaken = (displayname, cb) => {
    Profile.count({displayName: {regexp: '^' + displayname + '$/i'}}, (err, items) => {
      if (err) {
        cb(err);
      }
      else {
        cb(null, {
          displayname: displayname,
          exists: items > 0
        });
      }
    });
  };

  Profile.remoteMethod('unilogin', {
    description: 'Login a user with unilogin.',
    accepts: [
      {arg: 'username', type: 'string', required: true},
      {arg: 'timestamp', type: 'string', required: true},
      {arg: 'authtoken', type: 'string', required: true},
      {arg: 'ttl', type: 'number', required: true}
    ],
    returns: {
      arg: 'accessToken', type: 'object', root: true,
      description: 'The response body contains the accesstoken for the API.'
    },
    http: {verb: 'post'}
  });

  Profile.remoteMethod(
    'logout',
    {
      description: 'Logout a user with access token.',
      accepts: [
        {arg: 'access_token', type: 'string', required: true, http: function(ctx) {
          var req = ctx && ctx.req;
          var accessToken = req && req.accessToken;

          return accessToken && accessToken.id;
        }, description: 'Do not supply this argument, it is automatically extracted from request headers.'
        }
      ],
      http: {verb: 'all'}
    }
  );

  Profile.remoteMethod(
    'checkIfUserExists',
    {
      description: 'Check if a user exists.',
      accepts: {arg: 'username', type: 'string', required: true},
      returns: {
        arg: 'exists', type: 'object', root: true,
        description: 'The response body tells whether a user exists'
      },
      http: {verb: 'post'}
    }
  );

  Profile.remoteMethod(
    'checkIfDisplayNameIsTaken',
    {
      description: 'Check if displayname exists',
      accepts: {arg: 'displayname', type: 'string', required: true, description: 'The users displayname'},
      returns: {
        arg: 'exists', type: 'object', root: true,
        description: 'The response body tells whether a displayname is taken'
      },
      http: {verb: 'post'}
    }
  );

  Profile.observe('before save', (ctx, next) => {
    if (!ctx.isNewInstance && ctx.currentInstance) {
      if (ctx.data && ctx.data.displayName && ctx.data.displayName !== ctx.currentInstance.displayName) {
        Profile.checkIfDisplayNameIsTaken(ctx.data.displayName, (err, res) => {
          if (err) {
            next(err);
          }
          else if (res.exists) {
            next({
              error: 'Displayname already exists!'
            });
          }
          else {
            next();
          }
        });
      }
      else {
        next();
      }
    }
    else {
      next();
    }
  });

  Profile.observe('after save', (ctx, next) => {
    // was a new profile created?
    if (ctx.isNewInstance) {
      logger.info('created new profile', {instance: ctx.instance});

      Profile.app.models.CommunityRole.findById(1, (err, instance) => {
        ctx.instance.communityRoles.add(instance, (errInner) => {
          if (errInner !== null) {
            logger.info('could not assign role:', errInner);
          }
        });
      });
    }
    next();
  });
};
