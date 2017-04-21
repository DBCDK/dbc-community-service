module.exports = {
  up: function(dataSource, next) {
    const q = [
      'CREATE  INDEX "like_likeid_idx" ON "public"."like" ( "likeid");',
      'CREATE  INDEX "like_reviewlikeid_idx" ON "public"."like" ( "reviewlikeid");',

      'CREATE  INDEX "group_timeClosed_idx" ON "public"."group" ( "timeclosed");',
      'CREATE  INDEX "group_markedAsDeleted_idx" ON "public"."group" ( "markedasdeleted");',
      'CREATE  INDEX "group_timeCreated_idx" ON "public"."group" ( "timecreated" DESC);',
      'CREATE  INDEX "group_campaignGroupFK_idx" ON "public"."group" ( "campaigngroupfk");',

      'CREATE  INDEX "videocollection_commentvideocollection_idx" ON "public"."videocollection" ( "commentvideocollection");',
      'CREATE  INDEX "videocollection_postvideocollection_idx" ON "public"."videocollection" ( "postvideocollection");',
      'CREATE  INDEX "videocollection_reviewvideocollection_idx" ON "public"."videocollection" ( "reviewvideocollection");',

      'CREATE  INDEX "post_timecreated_idx" ON "public"."post" ( "timecreated" DESC);',
      'CREATE  INDEX "post_postownerid_idx" ON "public"."post" ( "postownerid");',
      'CREATE  INDEX "post_groupdeleted_idx" ON "public"."post" ( "groupdeleted");',
      'CREATE  INDEX "post_groupid_idx" ON "public"."post" ( "groupid");',

      'CREATE  INDEX "comment_postid_idx" ON "public"."comment" ( "postid");',
      'CREATE  INDEX "comment_commentownerid_idx" ON "public"."comment" ( "commentownerid");',
      'CREATE  INDEX "comment_timeCreated_idx" ON "public"."comment" ( "timecreated" DESC);',
      'CREATE  INDEX "comment_timeDeleted_idx" ON "public"."comment" ( "timedeleted");',

      'CREATE  INDEX "quarantine_quarantinedProfileId_idx" ON "public"."quarantine" ( "quarantinedprofileid");',
      'CREATE  INDEX "quarantine_start_idx" ON "public"."quarantine" ( "start" DESC);',
      'CREATE  INDEX "quarantine_end_idx" ON "public"."quarantine" ( "end" DESC);',

      'CREATE  INDEX "imagecollection_commentimagecollection_idx" ON "public"."imagecollection" ( "commentimagecollection");',
      'CREATE  INDEX "imagecollection_groupcoverimagecollectionid_idx" ON "public"."imagecollection" ( "groupcoverimagecollectionid");',
      'CREATE  INDEX "imagecollection_postimagecollection_idx" ON "public"."imagecollection" ( "postimagecollection");',
      'CREATE  INDEX "imagecollection_profileimagecollection_idx" ON "public"."imagecollection" ( "profileimagecollection");',
      'CREATE  INDEX "imagecollection_reviewimagecollection_idx" ON "public"."imagecollection" ( "reviewimagecollection");',

      'CREATE  INDEX "review_reviewownerid_idx" ON "public"."review" ( "reviewownerid");',
      'CREATE  INDEX "review_markedAsDeleted_idx" ON "public"."review" ( "markedasdeleted");',

      'CREATE  INDEX "campaign_type_idx" ON "public"."campaign" ( "type" );',

      'CREATE  INDEX "scanresult_filescan_idx" ON "public"."scanresult" ( "filescan");'
    ];

    dataSource.connector.query(q.join('\n'), next);
  },

  down: function(dataSource, next) {
    const q = [
      'DROP INDEX "like_likeid_idx";',
      'DROP INDEX "like_reviewlikeid_idx";',

      'DROP INDEX "group_timeClosed_idx";',
      'DROP INDEX "group_markedAsDeleted_idx";',
      'DROP INDEX "group_timeCreated_idx";',
      'DROP INDEX "group_campaignGroupFK_idx";',

      'DROP INDEX "videocollection_commentvideocollection_idx";',
      'DROP INDEX "videocollection_postvideocollection_idx";',
      'DROP INDEX "videocollection_reviewvideocollection_idx";',

      'DROP INDEX "post_timecreated_idx";',
      'DROP INDEX "post_postownerid_idx";',
      'DROP INDEX "post_groupdeleted_idx";',
      'DROP INDEX "post_groupid_idx";',

      'DROP INDEX "comment_postid_idx";',
      'DROP INDEX "comment_commentownerid_idx";',
      'DROP INDEX "comment_timeCreated_idx";',
      'DROP INDEX "comment_timeDeleted_idx";',

      'DROP INDEX "quarantine_quarantinedProfileId_idx";',
      'DROP INDEX "quarantine_start_idx";',
      'DROP INDEX "quarantine_end_idx";',

      'DROP INDEX "imagecollection_commentimagecollection_idx";',
      'DROP INDEX "imagecollection_groupcoverimagecollectionid_idx";',
      'DROP INDEX "imagecollection_postimagecollection_idx";',
      'DROP INDEX "imagecollection_profileimagecollection_idx";',
      'DROP INDEX "imagecollection_reviewimagecollection_idx";',

      'DROP INDEX "review_reviewownerid_idx";',
      'DROP INDEX "review_markedAsDeleted_idx";',

      'DROP INDEX "campaign_type_idx";',

      'DROP INDEX "scanresult_filescan_idx";'
    ];

    dataSource.connector.query(q.join('\n'), next);
  }
};
