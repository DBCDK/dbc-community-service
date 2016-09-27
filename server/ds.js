

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

function getDSDefs() {
  return config.get('CommunityService.datasources');
}

module.exports.getDSDefs = getDSDefs;

module.exports.getDS = function getDS() {
  const promises = [];
  const dsCfg = getDSDefs();

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
};
