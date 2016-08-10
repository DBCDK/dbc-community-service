

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query([
      'ALTER TABLE "public"."post" ADD COLUMN "attachedreviewid" INTEGER;',
      'ALTER TABLE "public"."comment" ADD COLUMN "attachedreviewid" INTEGER;'
    ].join('\n'), next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query([
      'ALTER TABLE "public"."post" DROP COLUMN "attachedreviewid";',
      'ALTER TABLE "public"."comment" DROP COLUMN "attachedreviewid";'
    ].join('\n'), next);
  }
};
