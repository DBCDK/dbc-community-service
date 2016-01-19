'use strict';

/**
 * @file Write a short description here.
 */

let conf;

if (process.env.USE_DEFAULT_CONFIG) { // eslint-disable-line
  conf = {
    db: {
      name: 'db',
      connector: 'memory'
    },
    psqlDs: {
      host: '127.0.0.1',
      port: 5432,
      database: 'dbc_community',
      username: 'communitydb',
      password: 'loobbackcommunity',
      name: 'psqlDs',
      connector: 'postgresql'
    },
    emailDs: {
      name: 'emailDs',
      connector: 'mail',
      transports: [
        {
          type: 'smtp',
          host: 'mailhost.example.com',
          secure: false,
          port: 25,
          tls: {
            rejectUnauthorized: false
          }
        }
      ]
    }
  };
}
else {
  conf = require('@dbcdk/biblo-config').communityservice.development;
}

module.exports = conf;
