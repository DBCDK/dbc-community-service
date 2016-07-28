module.exports = {
  up: function(dataSource, next) {
    // User
    dataSource.connector.query('ALTER TABLE "public"."user" ALTER COLUMN "realm" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."user"  ALTER COLUMN "username" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."user"  ALTER COLUMN "password" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."user"  ALTER COLUMN "credentials" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."user"  ALTER COLUMN "challenges" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."user"  ALTER COLUMN "email" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."user"  ALTER COLUMN "verificationtoken" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."user"  ALTER COLUMN "status" TYPE TEXT;', next);

    // Profile
    dataSource.connector.query('ALTER TABLE "public"."profile" ALTER COLUMN "username" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."profile"  ALTER COLUMN "displayname" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."profile"  ALTER COLUMN "favoritelibrary" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."profile"  ALTER COLUMN "description" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."profile"  ALTER COLUMN "email" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."profile"  ALTER COLUMN "phone" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."profile"  ALTER COLUMN "fullname" TYPE TEXT;', next);

    // Like
    dataSource.connector.query('ALTER TABLE "public"."like" ALTER COLUMN "item_id" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."like"  ALTER COLUMN "value" TYPE TEXT;', next);

    // Group
    dataSource.connector.query('ALTER TABLE "public"."group" ALTER COLUMN "name" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."group"  ALTER COLUMN "description" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."group"  ALTER COLUMN "colour" TYPE TEXT;', next);

    // Post
    dataSource.connector.query('ALTER TABLE "public"."post" ALTER COLUMN "title" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."post"  ALTER COLUMN "content" TYPE TEXT;', next);

    // Community Role
    dataSource.connector.query('ALTER TABLE "public"."communityrole" ALTER COLUMN "name" TYPE TEXT;', next);

    // Comment
    dataSource.connector.query('ALTER TABLE "public"."comment" ALTER COLUMN "content" TYPE TEXT;', next);

    // Quarantine
    dataSource.connector.query('ALTER TABLE "public"."quarantine" ALTER COLUMN "reason" TYPE TEXT;', next);

    // File
    dataSource.connector.query('ALTER TABLE "public"."file" ALTER COLUMN "container" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."file"  ALTER COLUMN "name" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."file"  ALTER COLUMN "type" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."file"  ALTER COLUMN "url" TYPE TEXT;', next);

    // Flag
    dataSource.connector.query('ALTER TABLE "public"."flag" ALTER COLUMN "description" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."flag"  ALTER COLUMN "_comments" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."flag"  ALTER COLUMN "_posts" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."flag"  ALTER COLUMN "_groups" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."flag"  ALTER COLUMN "_reviews" TYPE TEXT;', next);

    // Review
    dataSource.connector.query('ALTER TABLE "public"."review" ALTER COLUMN "pid" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."review"  ALTER COLUMN "libraryid" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."review"  ALTER COLUMN "worktype" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."review"  ALTER COLUMN "content" TYPE TEXT;', next);

    // Resolution
    dataSource.connector.query('ALTER TABLE "public"."resolution" ALTER COLUMN "size" TYPE TEXT;', next);

    // Campaign
    dataSource.connector.query('ALTER TABLE "public"."campaign" ALTER COLUMN "campaignname" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."campaign"  ALTER COLUMN "logos" TYPE TEXT;', next);
    dataSource.connector.query('ALTER TABLE "public"."campaign"  ALTER COLUMN "type" TYPE TEXT;', next);

    // Campaign Work Type
    dataSource.connector.query('ALTER TABLE "public"."campaignworktype" ALTER COLUMN "worktype" TYPE TEXT;', next);
  },

  down: function(dataSource, next) {
    // User
    dataSource.connector.query('ALTER TABLE "public"."user" ALTER COLUMN "realm" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."user" ALTER COLUMN "username" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."user" ALTER COLUMN "password" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."user" ALTER COLUMN "credentials" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."user" ALTER COLUMN "challenges" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."user" ALTER COLUMN "email" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."user" ALTER COLUMN "verificationToken" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."user" ALTER COLUMN "status" TYPE VARCHAR(1024);', next);

    // Profile
    dataSource.connector.query('ALTER TABLE "public"."profile" ALTER COLUMN "username" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."profile" ALTER COLUMN "displayName" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."profile" ALTER COLUMN "favoriteLibrary" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."profile" ALTER COLUMN "description" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."profile" ALTER COLUMN "email" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."profile" ALTER COLUMN "phone" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."profile" ALTER COLUMN "fullName" TYPE VARCHAR(1024);', next);

    // Like
    dataSource.connector.query('ALTER TABLE "public"."like" ALTER COLUMN "item_id" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."like" ALTER COLUMN "value" TYPE VARCHAR(1024);', next);

    // Group
    dataSource.connector.query('ALTER TABLE "public"."group" ALTER COLUMN "name" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."group" ALTER COLUMN "description" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."group" ALTER COLUMN "colour" TYPE VARCHAR(1024);', next);

    // Post
    dataSource.connector.query('ALTER TABLE "public"."post" ALTER COLUMN "title" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."post" ALTER COLUMN "content" TYPE VARCHAR(1024);', next);

    // Community Role
    dataSource.connector.query('ALTER TABLE "public"."communityrole" ALTER COLUMN "name" TYPE VARCHAR(1024);', next);

    // Comment
    dataSource.connector.query('ALTER TABLE "public"."comment" ALTER COLUMN "content" TYPE VARCHAR(1024);', next);

    // Quarantine
    dataSource.connector.query('ALTER TABLE "public"."quarantine" ALTER COLUMN "reason" TYPE VARCHAR(1024);', next);

    // File
    dataSource.connector.query('ALTER TABLE "public"."file" ALTER COLUMN "container" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."file" ALTER COLUMN "name" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."file" ALTER COLUMN "type" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."file" ALTER COLUMN "url" TYPE VARCHAR(1024);', next);

    // Flag
    dataSource.connector.query('ALTER TABLE "public"."flag" ALTER COLUMN "description" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."flag" ALTER COLUMN "_comments" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."flag" ALTER COLUMN "_posts" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."flag" ALTER COLUMN "_groups" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."flag" ALTER COLUMN "_reviews" TYPE VARCHAR(1024);', next);

    // Review
    dataSource.connector.query('ALTER TABLE "public"."review" ALTER COLUMN "pid" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."review" ALTER COLUMN "libraryid" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."review" ALTER COLUMN "worktype" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."review" ALTER COLUMN "content" TYPE VARCHAR(25000);', next);

    // Resolution
    dataSource.connector.query('ALTER TABLE "public"."resolution" ALTER COLUMN "size" TYPE VARCHAR(1024);', next);

    // Campaign
    dataSource.connector.query('ALTER TABLE "public"."campaign" ALTER COLUMN "campaignName" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."campaign" ALTER COLUMN "logos" TYPE VARCHAR(1024);', next);
    dataSource.connector.query('ALTER TABLE "public"."campaign" ALTER COLUMN "type" TYPE VARCHAR(1024);', next);

    // Campaign Work Type
    dataSource.connector.query('ALTER TABLE "public"."campaignworktype" ALTER COLUMN "worktype" TYPE VARCHAR(1024);', next);
  }
};
