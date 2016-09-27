'use strict';

let config;
try {
  config = require('@dbcdk/biblo-config').config;
}
catch (err) {
  config = require('config');
}

const loopback = require('loopback');
require('babel-core/register');

const promises = [];
const dsCfg = config.get('CommunityService.datasources');
Object.keys(dsCfg).forEach(ds => {
  promises.push((resolve, reject) => {
    const datasource = loopback.createDataSource(dsCfg[ds]);
    datasource.on('connected', () => {
      resolve(datasource);
    });

    datasource.on('error', error => {
      reject(error);
    });
  });
});

Promise.all(promises).then(() => {
  require('./server/server');
}).catch((err) => {
  console.error(err);
});
