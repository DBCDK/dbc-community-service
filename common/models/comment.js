'use strict';

module.exports = function(Comment) {  // eslint-disable-line no-unused-vars

  Comment.remoteMethod('createFlag', {
    description: 'Flag a comment',
    accepts: [
      {arg: 'description', type: 'string', required: true},
      {arg: 'profileid', type: 'number', required: true},
      {arg: 'commentid', type: 'number', required: true}
    ],
    returns: {
      arg: 'flagid', type: 'number',
      description: 'The id of the newly created flag'
    },
    http: {verb: 'post'}
  });

  Comment.createFlag = (description, profileid, commentid, cb) => {
    const Profile = Comment.app.models.Profile;

    // Check if comment exists
    const commentExistsPromise = new Promise((resolve, reject) => {
      Comment.exists(commentid, (err, val) => {
        if (err !== null) {
          reject(err);
        }
        resolve(val);
      });
    });


    commentExistsPromise.then((truthy) => {
      if (!truthy) {
        cb(new Error('commentid ' + commentid + ' does not exist.'), null);
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
          Comment.findOne({id: commentid}, (err, comment) => { // eslint-disable-line no-shadow

            comment.flags.add(flagInstance, (err) => { // eslint-disable-line no-shadow

              if (err !== null) {
                cb(new Error('could not create comment.flag relation'), null);
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
