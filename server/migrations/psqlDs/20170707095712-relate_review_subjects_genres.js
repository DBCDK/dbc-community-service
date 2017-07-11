module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(`
      CREATE TABLE "public"."reviewbibliographicgenre" (
        "id" SERIAL,
        "reviewid" INTEGER,
        "bibliographicgenreid" INTEGER,
        PRIMARY KEY("id")
      );
      CREATE TABLE "public"."reviewbibliographicsubject" (
        "id" SERIAL,
        "reviewid" INTEGER,
        "bibliographicsubjectid" INTEGER,
        PRIMARY KEY("id")
      );
      `, next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query(`
      DROP TABLE "public"."reviewbibliographicgenre";
      DROP TABLE "public"."reviewbibliographicsubject";
      `, next);
  }
};
