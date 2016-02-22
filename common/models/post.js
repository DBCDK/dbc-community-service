'use strict';

module.exports = function(Post) { // eslint-disable-line no-unused-vars

  Post.remoteMethod('createFlag', {
    description: 'Flag a post',
    accepts: [
      {arg: 'description', type: 'string', required: true},
      {arg: 'profileid', type: 'number', required: true},
      {arg: 'postid', type: 'number', required: true}
    ],
    returns: {
      arg: 'flagid', type: 'number',
      description: 'The id of the newly created flag'
    },
    http: {verb: 'post'}
  });

  Post.createFlag = (description, profileid, postid, cb) => {
    const Profile = Post.app.models.Profile;

    // Check if comment exists
    const postExistsPromise = new Promise((resolve, reject) => {
      Post.exists(postid, (err, val) => {
        if (err !== null) {
          reject(err);
        }
        resolve(val);
      });
    });


    postExistsPromise.then((truthy) => {
      if (!truthy) {
        cb(new Error('postid ' + postid + ' does not exist.'), null);
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
          Post.findOne({id: postid}, (err, post) => { // eslint-disable-line no-shadow

            post.flags.add(flagInstance, (err) => { // eslint-disable-line no-shadow

              if (err !== null) {
                cb(new Error('could not create post.flag relation'), null);
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
