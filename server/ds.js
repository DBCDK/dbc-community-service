

/**
 * @file Datasource configuration.
 */

let config;
try {
  config = require('@dbcdk/biblo-config').config;
}
catch (err) {
  config = require('config');
}

const loopback = require('loopback');

module.exports.getDS = function getDS() {
  const promises = [];
  const dsCfg = config.get('CommunityService.datasources');

  Object.keys(dsCfg).forEach(ds => {
    promises.push(new Promise((resolve, reject) => {
      const datasource = loopback.createDataSource(dsCfg[ds]);
      datasource.on('connected', () => {
        resolve(datasource);
      });

      datasource.on('error', error => {
        reject(error);
      });
    }));
  });

  return promises;
}
