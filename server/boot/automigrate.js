'use strict';


let path = require('path');
let app = require(path.resolve(__dirname, '../server'));


module.exports = function automigrate() {

  let ds = app.dataSources.PsqlDs;
  const lbTables = ['Profile', 'Like', 'Dislike'];
  ds.automigrate(lbTables, function (err) {
    if (err) {
      throw err;
    }
    console.log('Automigration - tables dropped and recreated'); // eslint-disable-line no-console
  });

};
