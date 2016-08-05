module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."group" ADD COLUMN "timeclosed" TIMESTAMP WITH TIME ZONE;', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."group" DROP COLUMN "timeClosed";', next);
  }
};
