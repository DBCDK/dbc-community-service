

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
else if (process.env.USE_ENV_CONFIG) { // eslint-disable-line
  conf = {
    db: {
      name: 'db',
      connector: 'memory'
    },
    psqlDs: {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      database: process.env.DATABASE_DB,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      name: 'psqlDs',
      connector: process.env.DATABASE_CONNECTOR || 'postgresql'
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
