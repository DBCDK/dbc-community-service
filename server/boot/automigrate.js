'use strict';


let path = require('path');
let app = require(path.resolve(__dirname, '../server'));


module.exports = function automigrate(model, cb) {

  let ds = app.dataSources.PsqlDs;
  const appModels = ['Profile', 'Like'];

  ds.isActual(appModels, function(err, actual) {
    if (!actual) {
      console.log('No tables for models - creating new tables'); // eslint-disable-line no-console
      ds.autoupdate(appModels, function(err) {
        if (err) {
          throw (err);
        }
      });
    }
    else {
      console.log('Model tables already exist - no new tables are created'); // eslint-disable-line no-console
    }
  });

  cb();
};
