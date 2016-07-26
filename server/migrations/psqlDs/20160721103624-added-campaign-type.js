

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."campaign" ADD COLUMN "type" VARCHAR(1024) NOT NULL;', next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('ALTER TABLE "public"."campaign" DROP COLUMN "type";', next);
  }
};
