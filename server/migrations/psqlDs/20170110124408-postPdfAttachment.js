module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."file" ADD COLUMN "postpdfattachment" INTEGER;', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."file" DROP COLUMN "postPdfAttachment";', next);
  }
};
