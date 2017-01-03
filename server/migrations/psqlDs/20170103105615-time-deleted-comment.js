module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."comment" ADD COLUMN "timedeleted" TIMESTAMP WITH TIME ZONE;', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."comment" DROP COLUMN "timeDeleted";', next);
  }
};
