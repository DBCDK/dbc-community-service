

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(`
      CREATE TABLE "public"."campaignworktype" (
        "worktype" VARCHAR(1024) NOT NULL,
        "id" SERIAL,
        PRIMARY KEY("id")
      );
    `, next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('DROP TABLE "public"."campaignworktype";', next);
  }
};
