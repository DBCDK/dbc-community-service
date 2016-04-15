'use strict';

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('', next);
  }
};
