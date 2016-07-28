module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."groupprofile" ADD COLUMN "visited" TIMESTAMP WITH TIME ZONE;', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."groupprofile" DROP COLUMN "visited";', next);
  }
};
