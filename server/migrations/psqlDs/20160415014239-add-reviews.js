

module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(
      'ALTER TABLE "public"."like" ADD COLUMN "reviewlikeid" INTEGER;\n' +
      'ALTER TABLE "public"."flag" ADD COLUMN "reviewflagsid" INTEGER;\n' +
      'ALTER TABLE "public"."flag" ADD COLUMN "_reviews" VARCHAR(1024);\n' +
      'CREATE TABLE "public"."review" (' +
      '  "pid" VARCHAR(1024) NOT NULL,' +
      '  "worktype" VARCHAR(1024) NOT NULL,' +
      '  "content" VARCHAR(1024),' +
      '  "created" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "modified" TIMESTAMP WITH TIME ZONE NOT NULL,' +
      '  "rating" INTEGER NOT NULL,' +
      '  "id" SERIAL,' +
      '  "reviewownerid" INTEGER,' +
      '  PRIMARY KEY("id")' +
      ');\n' +
      'ALTER TABLE "public"."imagecollection" ADD COLUMN "reviewimagecollection" INTEGER;\n' +
      'ALTER TABLE "public"."videocollection" ADD COLUMN "reviewvideocollection" INTEGER;\n',
      next
    );
  },

  down: function(dataSource, next) {
    dataSource.connector.query(
      'ALTER TABLE "public"."like" DROP COLUMN "reviewlikeid";\n' +
      'ALTER TABLE "public"."flag" DROP COLUMN "_reviews";\n' +
      'ALTER TABLE "public"."flag" DROP COLUMN "reviewflagsid";\n' +
      'ALTER TABLE "public"."imagecollection" DROP COLUMN "reviewimagecollection";\n' +
      'ALTER TABLE "public"."videocollection" DROP COLUMN "reviewvideocollection";\n' +
      'DROP TABLE "public"."review";\n',
      next
    );
  }
};
