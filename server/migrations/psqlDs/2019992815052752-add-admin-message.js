module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(
      'CREATE TABLE "public"."adminmessage" (' +
      '  "id" SERIAL,' +
      '  "message" VARCHAR(1024),' +
      '  "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "receiverprofileid" INTEGER,' +
      '  "senderprofileid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');',
      next
    );
  },
  down: function(dataSource, next) {
    dataSource.connector.query('DROP TABLE "public"."adminmessage";', next);
  }
};
