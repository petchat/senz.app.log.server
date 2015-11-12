var req = require("request");



module.exports = function(UserStatus) {

  UserStatus.observe("before save", function(ctx, next){


    console.log(ctx)

    ////
    //// before save hook can create the updatedAt and createdAt
    ////
      console.log('Saved %s', ctx.Model.modelName);
      //
      ctx.instance.lastUpdatedAt = Date.now();
      ctx.instance.updatedAt = Date.now();
    if(ctx.isNewInstance) {

      ctx.instance.createdAt = Date.now();

    }
    else{
      console.log("updated %s",ctx.Model.pluralModelName)

    }
    next();
  })

  UserStatus.observe("after save", function(ctx, next){

    var object = ctx.instance;
    var obj = {};
    var context = object.context
    var behavior = object.behavior;

    var wilddog_context_url = "https://hengyang.wilddogio.com/" + object.userId + "/context.json";
    var wilddog_behavior_url = "https://hengyang.wilddogio.com/" + object.userId + "/behavior.json";

    req.put({
      url:wilddog_context_url,
      json: {"name":context}
    },function(err, res, body){
      if(!err ){
        console.log("context success");
        console.log(body);
      }
    });

    req.put({
      url:wilddog_behavior_url,
      json: {"name":behavior}
    },function(err, res, body){
      if(!err ){
        console.log("success");
        console.log(body);
      }
    });


    next();
  })

};


