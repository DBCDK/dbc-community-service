import crypto from 'crypto';

module.exports = {
  up: async function(dataSource, next) {
    dataSource.connector.query(
      `
    SELECT username from profile
    `,
      (err, result) => {
        const changePromises = result.map(({username}) => {
          const saltedUsername = crypto
            .createHmac('sha256', 'alibaliby')
            .update(username)
            .digest('hex');
          return new Promise((resolve, reject) => {
            dataSource.connector.query(
              `UPDATE profile SET username = '${saltedUsername}' WHERE username = '${username}'`,
              err => {
                if (err) {
                  reject(err);
                }
                resolve();
              }
            );
          });
        });
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
