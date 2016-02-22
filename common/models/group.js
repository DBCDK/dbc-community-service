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


  Group.remoteMethod('createFlag', {
    description: 'Flag a group',
    accepts: [
      {arg: 'description', type: 'string', required: true},
      {arg: 'profileid', type: 'number', required: true},
      {arg: 'groupid', type: 'number', required: true}
    ],
    returns: {
      arg: 'groupid', type: 'number',
      description: 'The id of the newly created flag'
    },
    http: {verb: 'post'}
  });

  Group.createFlag = (description, profileid, groupid, cb) => {
    const Profile = Group.app.models.Profile;

    // Check if comment exists
    const groupExistsPromise = new Promise((resolve, reject) => {
      Group.exists(groupid, (err, val) => {
        if (err !== null) {
          reject(err);
        }
        resolve(val);
      });
    });


    groupExistsPromise.then((truthy) => {
      if (!truthy) {
        cb(new Error('groupid ' + groupid + ' does not exist.'), null);
      }

      // now check if profile exists
      return new Promise((resolve, reject) => {
        Profile.exists(profileid, (err, val) => {
          if (err !== null) {
            reject(err);
          }
          resolve(val);
        });
      });

    }).then((profileExists) => {
      if (!profileExists) {
        cb(new Error('profileid ' + profileid + ' does not exist.'), null);
      }

      // now create flag through profile
      Profile.findOne({id: profileid}, (err, profile) => { // eslint-disable-line no-shadow
        if (err === null) {
          throw new Error('profile not found');
        }

        const flag = {
          timeFlagged: (new Date(Date.now())).toISOString(),
          description: description
        };

        profile.flags.create(flag, (err, flagInstance) => { // eslint-disable-line no-shadow
          if (err !== null) {
            cb(new Error('could not create flag'), null);
          }

          // create relation from comment to flag
          Group.findOne({id: groupid}, (err, group) => { // eslint-disable-line no-shadow

            group.flags.add(flagInstance, (err) => { // eslint-disable-line no-shadow

              if (err !== null) {
                cb(new Error('could not create group.flag relation'), null);
              }

            });

          });

          // if all went well, return the happy ending exit code.
          cb(null, flagInstance.id);

        });
      });
    });
  };
};
