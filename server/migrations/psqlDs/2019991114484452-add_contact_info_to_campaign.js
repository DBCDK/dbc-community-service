module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."campaign" ADD COLUMN "requiredcontactinfo" VARCHAR(64);', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."campaign" DROP COLUMN "requiredcontactinfo"', next);
  }
};
