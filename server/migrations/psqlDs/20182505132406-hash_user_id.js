import crypto from 'crypto';
      
module.exports = {
  up: async function(dataSource, next) {
    dataSource.connector.query(`
    SELECT username from profile
    `, (err, result) => {
      console.log(err, result);
      result.forEach(({username}) => {
        const saltedUsername = crypto
        .createHmac('sha256', 'alibaliby').update(username)
      .digest('hex');

        dataSource.connector.query(`UPDATE profile SET username = '${saltedUsername}' WHERE username = '${username}'`, (err) => {
          console.log(err);
        });
      });
    });
  },
  down: function(dataSource, next) {
   next(); 
  }
};
