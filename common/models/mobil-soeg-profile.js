'use strict';

import bcrypt from 'bcryptjs';
import Config from '@dbcdk/dbc-config';

module.exports = function(MobilSoegProfile) {
  MobilSoegProfile.validatesUniquenessOf('loanerid', {scopedTo: ['agencyid'], message: 'loanerid is already registered with agencyid'});

  /**
   * Hash the loanerid with the salt provided through from the config file
   *
   * @param {string} plain
   * @return {string|?string}
   */
  MobilSoegProfile.hashLoanerid = (plain) => {
    MobilSoegProfile.validateLoanerid(plain);
    const salt = Config.profileservice.salt;
    return bcrypt.hashSync(plain, salt);
  };

  /**
   * Validate that the provided argument is actually a string
   *
   * @param {string} plain
   * @return {boolean}
   */
  MobilSoegProfile.validateLoanerid = (plain) => {
    if (typeof plain === 'string' && plain) {
      return true;
    }
    let err = new Error('Invalid loanerid: ' + plain);
    err.statusCode = 422;
    throw err;
  };

  /**
   * Implementation of the 'before save' hook
   * If the instance is a new instance the provided loanerid will be hashed
   * through the above hashLoanerid method.
   *
   * @see MobilSoegProfile.hashLoanerid
   * @see https://docs.strongloop.com/display/public/LB/Operation+hooks
   */
  MobilSoegProfile.observe('before save', (ctx, next) => {
    if (ctx.instance) {
      if (ctx.isNewInstance) {
        ctx.instance.loanerid = MobilSoegProfile.hashLoanerid(ctx.instance.loanerid);
      }
    }
    next();
  });

  /**
   * Static method that defines a remoteMethod named findMobilSoegProfile.
   *
   * Implementation:
   * @see MobilSoegProfile.findMobilSoegProfile
   *
   * Loopback documentation:
   * @see https://docs.strongloop.com/display/public/LB/Remote+methods
   */
  MobilSoegProfile.remoteMethod(
    'findMobilSoegProfile',
    {
      accepts: [
        {
          arg: 'agencyid',
          type: 'string',
          description: 'The agencyid the user id associated with - typically it would be 6 digets',
          required: true
        },
        {
          arg: 'loanerid',
          type: 'string',
          description: 'Loanerid of the user',
          required: true
        }
      ],
      description: 'Find a Mobil Søg user profile by providing the users agencyid and loanerid.',
      notes: 'If the user have any likes or dislikes they will be returned along the rest of the userdata',
      http: {
        verb: 'get',
        errorStatus: 404
      },
      returns: {
        arg: 'response',
        type: 'object'
      }
    }
  );

  /**
   * Retreives a loaners profile including likes.
   * This is is custom defined method (remoteMethod)
   *
   * @param {string} agencyid
   * @param {string} loanerid
   * @param {Function} cb
   * @see https://docs.strongloop.com/display/public/LB/Remote+methods
   */
  MobilSoegProfile.findMobilSoegProfile = (agencyid, loanerid, cb) => {
    // Hash the loanerid
    loanerid = MobilSoegProfile.hashLoanerid(loanerid);

    // Retreive the data and return a response appropriately
    MobilSoegProfile.findOne({where: {agencyid: agencyid, loanerid: loanerid}, include: 'likes'}, (err, instance) => {
      if (instance) {
        cb(null, instance);
      }
      else {
        cb({status: 404, message: 'The user could not be found'});
      }
    });
  };
};
