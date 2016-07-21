'use strict';

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(`
      CREATE TABLE "public"."campaign" (
        "campaignname" VARCHAR(1024) NOT NULL,
        "startdate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "enddate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "logos" VARCHAR(1024) NOT NULL,
        "id" SERIAL,
        PRIMARY KEY("id")
      );
    `, next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('DROP TABLE "public"."campaign";', next);
  }
};
