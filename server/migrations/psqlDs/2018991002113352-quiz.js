module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(
      'CREATE TABLE "public"."quizresult" (' +
        '  "id" SERIAL,' +
        '  "quizid" VARCHAR(1024) NOT NULL,' +
        '  "ownerid" INTEGER NOT NULL,' +
        '  "result" VARCHAR(2048),' +
        '  "created" TIMESTAMP WITH TIME ZONE NOT NULL,' +
        '  PRIMARY KEY("id")' +
        ');\n' +
        'CREATE INDEX "quiz_id_idx" ON "public"."quizresult" ( "quizid" );\n' +
        'CREATE INDEX "owner_id_idx" ON "public"."quizresult" ( "ownerid" );\n' +
        'CREATE INDEX quiz_id_owner_id_idx ON "public"."quizresult" ( "quizid", "ownerid" );',
      next
    );
  },
  down: function(dataSource, next) {
    dataSource.connector.query('DROP TABLE "public"."quizresult";', next);
  }
};
