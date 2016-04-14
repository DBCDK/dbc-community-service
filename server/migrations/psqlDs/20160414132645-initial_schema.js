'use strict';

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(
      'CREATE TABLE "public"."profile" (' +
      '  "username" VARCHAR(1024) NOT NULL,' +
      '  "displayname" VARCHAR(1024),' +
      '  "favoritelibrary" VARCHAR(1024),' +
      '  "description" VARCHAR(1024),' +
      '  "email" VARCHAR(1024),' +
      '  "phone" VARCHAR(1024),' +
      '  "created" TIMESTAMP WITH TIME ZONE,' +
      '  "lastupdated" TIMESTAMP WITH TIME ZONE,' +
      '  "hasfilledinprofile" BOOLEAN,' +
      '  "birthday" TIMESTAMP WITH TIME ZONE,' +
      '  "fullname" VARCHAR(1024),' +
      '  "palleid" INTEGER,' +
      '  "id" SERIAL,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE  UNIQUE  INDEX "profile_username_idx" ON "public"."profile" ( "username" );' +
      'CREATE  UNIQUE  INDEX "profile_displayname_idx" ON "public"."profile" ( "displayname" );' +
      'CREATE TABLE "public"."like" (' +
      '  "item_id" VARCHAR(1024),' +
      '  "value" VARCHAR(1024) NOT NULL,' +
      '  "id" SERIAL,' +
      '  "profileid" INTEGER,' +
      '  "likeid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."comment" (' +
      '  "content" VARCHAR(1024) NOT NULL,' +
      '  "timecreated" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "id" SERIAL,' +
      '  "commentownerid" INTEGER,' +
      '  "commentcontainerpostid" INTEGER,' +
      '  "postid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."group" (' +
      '  "name" VARCHAR(1024) NOT NULL,' +
      '  "description" VARCHAR(1024) NOT NULL,' +
      '  "colour" VARCHAR(1024),' +
      '  "timecreated" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "id" SERIAL,' +
      '  "groupownerid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."groupprofile" (' +
      '  "id" SERIAL,' +
      '  "groupid" INTEGER,' +
      '  "profileid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."quarantine" (' +
      '  "reason" VARCHAR(1024),' +
      '  "end" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "start" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "id" SERIAL,' +
      '  "quarantinedprofileid" INTEGER,' +
      '  "quarantinecreatorprofileid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."post" (' +
      '  "title" VARCHAR(1024) NOT NULL,' +
      '  "content" VARCHAR(1024),' +
      '  "timecreated" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "markedasdeleted" BOOLEAN,' +
      '  "id" SERIAL,' +
      '  "postownerid" INTEGER,' +
      '  "postcontainergroupid" INTEGER,' +
      '  "postid" INTEGER,' +
      '  "groupid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."postlike" (' +
      '  "id" SERIAL,' +
      '  "postid" INTEGER,' +
      '  "likeid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."profilecommunityrole" (' +
      '  "id" SERIAL,' +
      '  "profileid" INTEGER,' +
      '  "communityroleid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."communityrole" (' +
      '  "name" VARCHAR(1024) NOT NULL,' +
      '  "id" SERIAL,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."flag" (' +
      '  "timeflagged" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "description" VARCHAR(1024) NOT NULL,' +
      '  "markedasread" BOOLEAN NOT NULL,' +
      '  "id" SERIAL,' +
      '  "ownerid" INTEGER,' +
      '  "_comments" VARCHAR(1024),' +
      '  "_posts" VARCHAR(1024),' +
      '  "_groups" VARCHAR(1024),' +
      '  "groupflagsid" INTEGER,' +
      '  "postflagsid" INTEGER,' +
      '  "commentflagsid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."file" (' +
      '  "container" VARCHAR(1024),' +
      '  "name" VARCHAR(1024),' +
      '  "type" VARCHAR(1024),' +
      '  "url" VARCHAR(1024) NOT NULL,' +
      '  "id" SERIAL,' +
      '  "resolutionimagefileid" INTEGER,' +
      '  "resolutionvideofileid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."resolution" (' +
      '  "size" VARCHAR(1024) NOT NULL,' +
      '  "id" SERIAL,' +
      '  "videocollectionresolutionid" INTEGER,' +
      '  "imagecollectionresolutionid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."videocollection" (' +
      '  "id" SERIAL,' +
      '  "postvideocollection" INTEGER,' +
      '  "commentvideocollection" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'CREATE TABLE "public"."imagecollection" (' +
      '  "id" SERIAL,' +
      '  "profileimagecollection" INTEGER,' +
      '  "groupcoverimagecollectionid" INTEGER,' +
      '  "postimagecollection" INTEGER,' +
      '  "commentimagecollection" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');',
      next
    );
  },

  down: function(dataSource, next) {
    dataSource.connector.query(
      'DROP TABLE "public"."profile";\n' +
      'DROP TABLE "public"."like";\n' +
      'DROP TABLE "public"."comment";\n' +
      'DROP TABLE "public"."group";\n' +
      'DROP TABLE "public"."groupprofile";\n' +
      'DROP TABLE "public"."quarantine";\n' +
      'DROP TABLE "public"."post";\n' +
      'DROP TABLE "public"."postlike";\n' +
      'DROP TABLE "public"."profilecommunityrole";\n' +
      'DROP TABLE "public"."communityrole";\n' +
      'DROP TABLE "public"."flag";\n' +
      'DROP TABLE "public"."file";\n' +
      'DROP TABLE "public"."resolution";\n' +
      'DROP TABLE "public"."videocollection";\n' +
      'DROP TABLE "public"."imagecollection";',
      next
    );
  }
};
