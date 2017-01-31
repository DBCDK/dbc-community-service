module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(
      'CREATE TABLE "public"."scanresult" (' +
      '  "av" TEXT NOT NULL,' +
      '  "filename" TEXT NOT NULL,' +
      '  "created" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "detect" TEXT NOT NULL,' +
      '  "id" SERIAL,' +
      '  "filescan" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');',
      next
    );
  },
  down: function(dataSource, next) {
    dataSource.connector.query('DROP TABLE "public"."scanresult";', next);
  }
};
