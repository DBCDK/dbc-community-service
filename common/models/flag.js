'use strict';

module.exports = function (Flag) { // eslint-disable-line no-unused-vars

  Flag.observe('before save', function afterFlagSave(ctx, next) {


    let data;
    if (ctx.isNewInstance) {
      data = Object.assign({}, ctx.instance.__data);
    }
    else {
      data = Object.assign({}, ctx.currentInstance.__data, ctx.data);
    }

    // check that postId, commentId or groupId has been include
    const isPostFlag = typeof data.postFlagsId !== 'undefined' && data.postFlagsId;
    const isCommentFlag = typeof data.commentFlagsId !== 'undefined' && data.commentFlagsId;
    const isGroupFlag = typeof data.groupFlagsId !== 'undefined' && data.groupFlagsId;

    if (
      isCommentFlag && isPostFlag ||
      isCommentFlag && isGroupFlag ||
      isGroupFlag && isPostFlag
    ) {
      return next({error: 'Too many ids!'});
    }

    if (isPostFlag) {
      Flag.app.models.Post.findById(data.postFlagsId, (err, instance) => {
        if (err) {
          next(err);
        }
        else {

          if (ctx.isNewInstance) {
            ctx.instance.__data._posts = instance;
          }
          else {
            ctx.data._posts = instance;
          }

          next();
        }
      });
    }
    else if (isCommentFlag) {
      Flag.app.models.Comment.findById(data.commentFlagsId, (err, instance) => {
        if (err) {
          next(err);
        }
        else {

          if (ctx.isNewInstance) {
            ctx.instance.__data._comments = instance;
          }
          else {
            ctx.data._comments = instance;
          }

          next();
        }
      });
    }
    else if (isGroupFlag) {
      Flag.app.models.Group.findById(data.groupFlagsId, (err, instance) => {
        if (err) {
          next(err);
        }
        else {

          if (ctx.isNewInstance) {
            ctx.instance.__data._groups = instance;
          }
          else {
            ctx.data._groups = instance;
          }

          next();
        }
      });
    }
    else {
      next();
    }


  });
};
