

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query([
      'ALTER TABLE "public"."review" ALTER COLUMN "content" TYPE VARCHAR(25000);',
      'ALTER TABLE "public"."review" ADD COLUMN "palleid" INTEGER;'
    ].join('\n'), next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query([
      'ALTER TABLE "public"."review" ALTER COLUMN "content" TYPE VARCHAR(1024);',
      'ALTER TABLE "public"."review" DROP COLUMN "palleid";'
    ].join('\n'), next);
  }
};
