module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."post" ADD COLUMN "groupdeleted" BOOLEAN DEFAULT false', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."post" DROP COLUMN "groupdeleted"', next);
  }
};
