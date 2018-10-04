module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."quizresult" ADD COLUMN "libraryid" VARCHAR(1024);', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."quizresult" DROP COLUMN "libraryid";', next);
  }
};
