

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(`
      CREATE TABLE "public"."campaigncampaignworktype" (
        "id" SERIAL,
        "campaignid" INTEGER,
        "campaignworktypeid" INTEGER,
        PRIMARY KEY("id")
      );
    `, next);
  },
  down: function(dataSource, next) {
    dataSource.connector.query('DROP TABLE "public"."campaigncampaignworktype";', next);
  }
};
