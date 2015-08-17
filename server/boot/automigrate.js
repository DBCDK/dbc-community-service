'use strict';


let path = require('path');
let app = require(path.resolve(__dirname, '../server'));


module.exports = function automigrate() {

  let ds = app.dataSources.PsqlDs;

  ds.automigrate('Profile', function (err) {
    if (err) {
      throw err;
    }

    console.log('Automigration - table dropped and recreated'); // eslint-disable-line no-console
  });

};
