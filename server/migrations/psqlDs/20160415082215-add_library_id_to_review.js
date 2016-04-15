'use strict';

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."review" ADD COLUMN "libraryid" VARCHAR(1024) NOT NULL;', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."review" DROP COLUMN "libraryid";', next);
  }
};
