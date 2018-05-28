import {hashUsername} from '../../../common/utils/hash.utils';

function updateUsernameToHashValue(username, dataSource) {
  const hashedUsername = hashUsername(username);
  return new Promise((resolve, reject) => {
    dataSource.connector.query(
      `UPDATE profile SET username = '${hashedUsername}' WHERE username = '${username}'`,
      err => {
        if (err) {
          reject(err);
        }
        resolve();
      }
    );
  });
}

module.exports = {
  up: async function(dataSource, next) {
    dataSource.connector.query(`SELECT username from profile`, (err, result) => {
      if (err) {
        throw new Error(err);
      }
      const changePromises = result.map(({username}) => updateUsernameToHashValue(username, dataSource));
      Promise.all(changePromises)
        .then(() => {
          next();
        })
        .catch(e => {
          throw new Error(e);
        });
    });
  },
  down: function(dataSource, next) {
    next();
  }
};
