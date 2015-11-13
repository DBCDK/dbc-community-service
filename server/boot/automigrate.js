'use strict';

import app from '../server';

module.exports = function automigrate(model, cb) {

  let ds = app.dataSources.PsqlDs;
  const appModels = ['Profile', 'MobilSoegProfile', 'Like', 'Group', 'Comment', 'Post', 'GroupProfile'];

  ds.isActual(appModels, (err, actual) => {
    if (!actual) {
      console.log('No tables for models - creating new tables'); // eslint-disable-line no-console
      ds.autoupdate(appModels, (error) => {
        if (error) {
          throw (error);
        }
      });
    }
    else {
      console.log('Model tables already exist - no new tables are created'); // eslint-disable-line no-console
    }
  });

  cb();
};
