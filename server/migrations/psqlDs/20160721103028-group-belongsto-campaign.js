'use strict';

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."group" ADD COLUMN "campaigngroupfk" INTEGER;', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."group" DROP COLUMN "campaigngroupfk";', next);
  }
};
