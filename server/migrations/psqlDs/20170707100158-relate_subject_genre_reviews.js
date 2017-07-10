module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(`
      CREATE TABLE "public"."bibliographicsubjectreview" (
        "id" SERIAL,
        "bibliographicsubjectid" INTEGER,
        "reviewid" INTEGER,
        PRIMARY KEY("id")
      );
      CREATE TABLE "public"."bibliographicgenrereview" (
        "id" SERIAL,
        "bibliographicgenreid" INTEGER,
        "reviewid" INTEGER,
        PRIMARY KEY("id")
      );
      `, next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query(`
      DROP TABLE "public"."bibliographicsubjectreview";
      DROP TABLE "public"."bibliographicgenrereview";
      `, next);
  }
};
