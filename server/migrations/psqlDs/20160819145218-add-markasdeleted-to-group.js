module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."group" ADD COLUMN "markedasdeleted" BOOLEAN DEFAULT false', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."group" DROP COLUMN "markedasdeleted"', next);
  }
};
