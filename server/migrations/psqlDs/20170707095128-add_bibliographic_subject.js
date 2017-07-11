module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('CREATE TABLE "public"."bibliographicsubject" ( "title" TEXT NOT NULL, "id" SERIAL, PRIMARY KEY("id") );', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('DROP TABLE "public"."bibliographicsubject";', next);
  }
};
