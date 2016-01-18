'use strict';
import * as logger from 'dbc-node-logger';
import app from '../server';

function migrateTables(ds, appModels) {
  ds.isActual(appModels, (err, actual) => {
    if (!actual) {
      logger.debug('No tables for models - creating new tables'); // eslint-disable-line no-console
      ds.autoupdate(appModels, (error) => {
        if (error) {
          throw (error);
        }
      });
    }
    else {
      logger.debug('Model tables already exist - no new tables are created'); // eslint-disable-line no-console
    }
  });
}

module.exports = function automigrate(model, cb) {

  let ds = app.dataSources.PsqlDs;
  const appModels = ['Profile', 'Like', 'Group', 'Comment', 'Post', 'GroupProfile'];

  if (ds.connected) {
    migrateTables(ds, appModels);
  }
  else {
    ds.once('connected', () => {
      migrateTables(ds, appModels);
    });
  }
  cb();
};
