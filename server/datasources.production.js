

/**
 * @file Write a short description here.
 */

let config;
try {
  config = require('@dbcdk/biblo-config').config;
}
catch (err) {
  config = require('config');
}

module.exports = config.get('CommunityService.datasources');
