module.exports = function(SenzApp) {



  SenzApp.observe("before save", function(ctx, next){

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



  SenzApp.observe("after save", function(ctx, next){
    if(ctx.isNewInstance){
      console.log('Saved %s#%s', ctx.Model.modelName, ctx.instance.id);
    }
    else{
      console.log('Updated %s matching %j',
        ctx.Model.pluralModelName,
        ctx.instance);    }
    next();
  })
};
