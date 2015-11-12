module.exports = function(PrunedUserLog) {

  PrunedUserLog.observe("before save", function(ctx, next){

    ////
    //// before save hook can create the updatedAt and createdAt
    ////
    console.log('Saved %s', ctx.Model.modelName);

    ctx.instance.updatedAt = Date.now();
    if(ctx.isNewInstance) {

      ctx.instance.createdAt = Date.now();

    }
    else{
      console.log("updated %s",ctx.Model.pluralModelName)

    }
    next();
  });

};
