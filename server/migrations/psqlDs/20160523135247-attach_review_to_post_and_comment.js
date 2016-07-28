

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."post" ADD COLUMN "attachedreviewid" INTEGER;', next);
    dataSource.connector.query('ALTER TABLE "public"."comment" ADD COLUMN "attachedreviewid" INTEGER;', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."post" DROP COLUMN "attachedreviewid";', next);
    dataSource.connector.query('ALTER TABLE "public"."comment" DROP COLUMN "attachedreviewid";', next);
  }
};
