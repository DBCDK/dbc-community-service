

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."review" ADD COLUMN "markedasdeleted" BOOLEAN', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."review" DROP COLUMN "markedasdeleted" BOOLEAN', next);
  }
};
