'use strict';

/**
 * @file
 *
 * Implements the MobilSoegProfile model
 */

import bcrypt from 'bcryptjs';
import Config from '@dbcdk/dbc-config';

import * as logger from 'dbc-node-logger';

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
    logger.notice('An invalid loanerid was given. No profile was created.', {error: err});
    throw err;
  };

  /**
   * Implementation of the 'before save' hook.
   * The ctx (context) parameter is passed to the newInstanceCheck metod where
   * lonerid might be hashed.
   *
   * @see MobilSoegProfile.newInstanceCheck
   * @see https://docs.strongloop.com/display/public/LB/Operation+hooks
   */
  MobilSoegProfile.observe('before save', (ctx, next) => {
    MobilSoegProfile.newInstanceCheck(ctx);
    next();
  });

  /**
   * If the instance is a new instance the provided loanerid will be hashed
   * through the above hashLoanerid method.
   *
   * @param {Object} ctx Loopback context object
   * @see MobilSoegProfile.hashLoanerid
   */
  MobilSoegProfile.newInstanceCheck = (ctx) => {
    if (ctx.instance && ctx.isNewInstance) {
      ctx.instance.loanerid = MobilSoegProfile.hashLoanerid(ctx.instance.loanerid);
    }
  };

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
      description: 'Find a Mobil Søg user profile by providing the users agencyid and loanerid. </br> If no match is found a new user will be created and returned.',
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
   * Creates a new Mobil Søg profile
   *
   * @param {String} agencyid
   * @param {String} loanerid
   * @param {Function} cb Callback
   */
  MobilSoegProfile.createNewMobilSoegProfile = (agencyid, loanerid, cb) => {
    MobilSoegProfile.create({agencyid: agencyid, loanerid: loanerid, pickup_agency: null}, (err, instance) => {
      if (instance) {
        logger.info('A new MobilSøg profile was created', {instance: instance});
        cb(null, instance);
      }
      else {
        const msg = 'The user could not be found and the service failed to create a new profile';
        logger.error(msg, {instance: instance});
        cb({status: 404, message: msg});
      }
    });
  };

  /**
   * Retreives a loaners profile including likes.
   * This is a custom defined method (remoteMethod)
   *
   * @param {string} agencyid
   * @param {string} loanerid
   * @param {Function} cb Callback
   * @see https://docs.strongloop.com/display/public/LB/Remote+methods
   */
  MobilSoegProfile.findMobilSoegProfile = (agencyid, loanerid, cb) => {
    // Hash the loanerid
    const hashedLoanerid = MobilSoegProfile.hashLoanerid(loanerid);

    // Retreive the data and return a response appropriately
    MobilSoegProfile.findOne({where: {agencyid: agencyid, loanerid: hashedLoanerid}, include: 'likes'}, (err, instance) => {
      if (instance) {
        logger.info('Found an existing user', {instance: instance});
        cb(null, instance);
      }
      else {
        logger.info('No existing user was found. Attempting to create a new one', {agencyid: agencyid, loanerid: loanerid});
        MobilSoegProfile.createNewMobilSoegProfile(agencyid, loanerid, cb);
      }
    });
  };

  return MobilSoegProfile;
};
