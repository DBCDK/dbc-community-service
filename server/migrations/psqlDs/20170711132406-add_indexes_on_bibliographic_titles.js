module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(`CREATE INDEX "bibliographic_genre_title_idx" ON "public"."bibliographicgenre" ( "title");
    CREATE INDEX "bibliographic_subject_title_idx" ON "public"."bibliographicsubject" ( "title");
    `, next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query(`
      DROP INDEX "bibliographic_genre_title_idx";
      DROP INDEX "bibliographic_subject_title_idx";
      `, next);
  }
};
