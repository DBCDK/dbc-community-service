module.exports = {
  up: function(dataSource, next) {
    dataSource.connector.query(`
      /* User */
      ALTER TABLE "public"."user" ALTER COLUMN "realm" TYPE TEXT;
      ALTER TABLE "public"."user"  ALTER COLUMN "username" TYPE TEXT;
      ALTER TABLE "public"."user"  ALTER COLUMN "password" TYPE TEXT;
      ALTER TABLE "public"."user"  ALTER COLUMN "credentials" TYPE TEXT;
      ALTER TABLE "public"."user"  ALTER COLUMN "challenges" TYPE TEXT;
      ALTER TABLE "public"."user"  ALTER COLUMN "email" TYPE TEXT;
      ALTER TABLE "public"."user"  ALTER COLUMN "verificationtoken" TYPE TEXT;
      ALTER TABLE "public"."user"  ALTER COLUMN "status" TYPE TEXT;
      
      /* Profile */
      ALTER TABLE "public"."profile" ALTER COLUMN "username" TYPE TEXT;
      ALTER TABLE "public"."profile"  ALTER COLUMN "displayname" TYPE TEXT;
      ALTER TABLE "public"."profile"  ALTER COLUMN "favoritelibrary" TYPE TEXT;
      ALTER TABLE "public"."profile"  ALTER COLUMN "description" TYPE TEXT;
      ALTER TABLE "public"."profile"  ALTER COLUMN "email" TYPE TEXT;
      ALTER TABLE "public"."profile"  ALTER COLUMN "phone" TYPE TEXT;
      ALTER TABLE "public"."profile"  ALTER COLUMN "fullname" TYPE TEXT;

      /* Like */
      ALTER TABLE "public"."like" ALTER COLUMN "item_id" TYPE TEXT;
      ALTER TABLE "public"."like"  ALTER COLUMN "value" TYPE TEXT;

      /* Group */
      ALTER TABLE "public"."group" ALTER COLUMN "name" TYPE TEXT;
      ALTER TABLE "public"."group"  ALTER COLUMN "description" TYPE TEXT;
      ALTER TABLE "public"."group"  ALTER COLUMN "colour" TYPE TEXT;

      /* Post */
      ALTER TABLE "public"."post" ALTER COLUMN "title" TYPE TEXT;
      ALTER TABLE "public"."post"  ALTER COLUMN "content" TYPE TEXT;

      /* Community Role */
      ALTER TABLE "public"."communityrole" ALTER COLUMN "name" TYPE TEXT;

      /* Comment */
      ALTER TABLE "public"."comment" ALTER COLUMN "content" TYPE TEXT;

      /* Quarantine */
      ALTER TABLE "public"."quarantine" ALTER COLUMN "reason" TYPE TEXT;

      /* File */
      ALTER TABLE "public"."file" ALTER COLUMN "container" TYPE TEXT;
      ALTER TABLE "public"."file"  ALTER COLUMN "name" TYPE TEXT;
      ALTER TABLE "public"."file"  ALTER COLUMN "type" TYPE TEXT;
      ALTER TABLE "public"."file"  ALTER COLUMN "url" TYPE TEXT;

      /* Flag */
      ALTER TABLE "public"."flag" ALTER COLUMN "description" TYPE TEXT;
      ALTER TABLE "public"."flag"  ALTER COLUMN "_comments" TYPE TEXT;
      ALTER TABLE "public"."flag"  ALTER COLUMN "_posts" TYPE TEXT;
      ALTER TABLE "public"."flag"  ALTER COLUMN "_groups" TYPE TEXT;
      ALTER TABLE "public"."flag"  ALTER COLUMN "_reviews" TYPE TEXT;

      /* Review */
      ALTER TABLE "public"."review" ALTER COLUMN "pid" TYPE TEXT;
      ALTER TABLE "public"."review"  ALTER COLUMN "libraryid" TYPE TEXT;
      ALTER TABLE "public"."review"  ALTER COLUMN "worktype" TYPE TEXT;
      ALTER TABLE "public"."review"  ALTER COLUMN "content" TYPE TEXT;

      /* Resolution */
      ALTER TABLE "public"."resolution" ALTER COLUMN "size" TYPE TEXT;

      /* Campaign */
      ALTER TABLE "public"."campaign" ALTER COLUMN "campaignname" TYPE TEXT;
      ALTER TABLE "public"."campaign"  ALTER COLUMN "logos" TYPE TEXT;
      ALTER TABLE "public"."campaign"  ALTER COLUMN "type" TYPE TEXT;

      /* Campaign Work Type */
      ALTER TABLE "public"."campaignworktype" ALTER COLUMN "worktype" TYPE TEXT;
      `, next);
  },

  down: function(dataSource, next) {
    dataSource.connector.query(`
    /* User */
    ALTER TABLE "public"."user" ALTER COLUMN "realm" TYPE VARCHAR(1024);
    ALTER TABLE "public"."user" ALTER COLUMN "username" TYPE VARCHAR(1024);
    ALTER TABLE "public"."user" ALTER COLUMN "password" TYPE VARCHAR(1024);
    ALTER TABLE "public"."user" ALTER COLUMN "credentials" TYPE VARCHAR(1024);
    ALTER TABLE "public"."user" ALTER COLUMN "challenges" TYPE VARCHAR(1024);
    ALTER TABLE "public"."user" ALTER COLUMN "email" TYPE VARCHAR(1024);
    ALTER TABLE "public"."user" ALTER COLUMN "verificationToken" TYPE VARCHAR(1024);
    ALTER TABLE "public"."user" ALTER COLUMN "status" TYPE VARCHAR(1024);

    /* Profile */
    ALTER TABLE "public"."profile" ALTER COLUMN "username" TYPE VARCHAR(1024);
    ALTER TABLE "public"."profile" ALTER COLUMN "displayName" TYPE VARCHAR(1024);
    ALTER TABLE "public"."profile" ALTER COLUMN "favoriteLibrary" TYPE VARCHAR(1024);
    ALTER TABLE "public"."profile" ALTER COLUMN "description" TYPE VARCHAR(1024);
    ALTER TABLE "public"."profile" ALTER COLUMN "email" TYPE VARCHAR(1024);
    ALTER TABLE "public"."profile" ALTER COLUMN "phone" TYPE VARCHAR(1024);
    ALTER TABLE "public"."profile" ALTER COLUMN "fullName" TYPE VARCHAR(1024);

    /* Like */
    ALTER TABLE "public"."like" ALTER COLUMN "item_id" TYPE VARCHAR(1024);
    ALTER TABLE "public"."like" ALTER COLUMN "value" TYPE VARCHAR(1024);

    /* Group */
    ALTER TABLE "public"."group" ALTER COLUMN "name" TYPE VARCHAR(1024);
    ALTER TABLE "public"."group" ALTER COLUMN "description" TYPE VARCHAR(1024);
    ALTER TABLE "public"."group" ALTER COLUMN "colour" TYPE VARCHAR(1024);

    /* Post */
    ALTER TABLE "public"."post" ALTER COLUMN "title" TYPE VARCHAR(1024);
    ALTER TABLE "public"."post" ALTER COLUMN "content" TYPE VARCHAR(1024);

    /* Community Role */
    ALTER TABLE "public"."communityrole" ALTER COLUMN "name" TYPE VARCHAR(1024);

    /* Comment */
    ALTER TABLE "public"."comment" ALTER COLUMN "content" TYPE VARCHAR(1024);

    /* Quarantine */
    ALTER TABLE "public"."quarantine" ALTER COLUMN "reason" TYPE VARCHAR(1024);

    /* File */
    ALTER TABLE "public"."file" ALTER COLUMN "container" TYPE VARCHAR(1024);
    ALTER TABLE "public"."file" ALTER COLUMN "name" TYPE VARCHAR(1024);
    ALTER TABLE "public"."file" ALTER COLUMN "type" TYPE VARCHAR(1024);
    ALTER TABLE "public"."file" ALTER COLUMN "url" TYPE VARCHAR(1024);

    /* Flag */
    ALTER TABLE "public"."flag" ALTER COLUMN "description" TYPE VARCHAR(1024);
    ALTER TABLE "public"."flag" ALTER COLUMN "_comments" TYPE VARCHAR(1024);
    ALTER TABLE "public"."flag" ALTER COLUMN "_posts" TYPE VARCHAR(1024);
    ALTER TABLE "public"."flag" ALTER COLUMN "_groups" TYPE VARCHAR(1024);
    ALTER TABLE "public"."flag" ALTER COLUMN "_reviews" TYPE VARCHAR(1024);

    /* Review */
    ALTER TABLE "public"."review" ALTER COLUMN "pid" TYPE VARCHAR(1024);
    ALTER TABLE "public"."review" ALTER COLUMN "libraryid" TYPE VARCHAR(1024);
    ALTER TABLE "public"."review" ALTER COLUMN "worktype" TYPE VARCHAR(1024);
    ALTER TABLE "public"."review" ALTER COLUMN "content" TYPE VARCHAR(25000);

    /* Resolution */
    ALTER TABLE "public"."resolution" ALTER COLUMN "size" TYPE VARCHAR(1024);

    /* Campaign */
    ALTER TABLE "public"."campaign" ALTER COLUMN "campaignName" TYPE VARCHAR(1024);
    ALTER TABLE "public"."campaign" ALTER COLUMN "logos" TYPE VARCHAR(1024);
    ALTER TABLE "public"."campaign" ALTER COLUMN "type" TYPE VARCHAR(1024);

    /* Campaign Work Type */
    ALTER TABLE "public"."campaignworktype" ALTER COLUMN "worktype" TYPE VARCHAR(1024);
    `, next);
  }
};
