'use strict';

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."review" ALTER COLUMN "content" TYPE VARCHAR(25000);', next);
    dataSource.connector.query('ALTER TABLE "public"."review" ADD COLUMN "palleid" INTEGER;', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."review" ALTER COLUMN "content" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."review" DROP COLUMN "palleid";', next);
  }
};
