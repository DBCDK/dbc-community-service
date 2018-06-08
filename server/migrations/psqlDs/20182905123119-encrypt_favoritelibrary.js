import {encryptData} from '../../../common/utils/crypto.utils';

function encryptFavoriteLibrary({username, favoritelibrary}, dataSource) {
  const encryptedFavoriteLibrary = encryptData(favoritelibrary);
  return new Promise((resolve, reject) => {
    dataSource.connector.query(
      `UPDATE profile SET favoritelibrary = '${encryptedFavoriteLibrary}' WHERE username = '${username}'`,
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
    dataSource.connector.query(
      `SELECT username, favoritelibrary from profile`,
      (err, result) => {
        if (err) {
          throw new Error(err);
        }
        const changePromises = result.map(({username, favoritelibrary}) =>
          encryptFavoriteLibrary({username, favoritelibrary}, dataSource)
        );
        Promise.all(changePromises)
          .then(() => {
            next();
          })
          .catch(e => {
            throw new Error(e);
          });
      }
    );
  },
  down: function(dataSource, next) {
    next();
  }
};
