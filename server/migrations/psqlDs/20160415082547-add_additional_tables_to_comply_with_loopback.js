

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(
      'CREATE TABLE "public"."profileprofile" (' +
      '  "id" SERIAL,' +
      '  "profileid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."user" (' +
      '  "realm" VARCHAR(1024),' +
      '  "username" VARCHAR(1024),' +
      '  "password" VARCHAR(1024) NOT NULL,' +
      '  "credentials" VARCHAR(1024),' +
      '  "challenges" VARCHAR(1024),' +
      '  "email" VARCHAR(1024) NOT NULL,' +
      '  "emailverified" BOOLEAN,' +
      '  "verificationtoken" VARCHAR(1024),' +
      '  "status" VARCHAR(1024),' +
      '  "created" TIMESTAMP WITH TIME ZONE,' +
      '  "lastupdated" TIMESTAMP WITH TIME ZONE,' +
      '  "id" SERIAL,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."profilecomment" (' +
      '  "id" SERIAL,' +
      '  "profileid" INTEGER,' +
      '  "commentid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');',
      next
    );
  },
  down: function(dataSource, next) {
    dataSource.connector.query(
      'DROP TABLE "public"."profilecomment";\n' +
      'DROP TABLE "public"."user";\n' +
      'DROP TABLE "public"."profileprofile";\n',
      next
    );
  }
};
