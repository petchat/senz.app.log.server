module.exports = function(UserLog) {

  UserLog.observe("before save", function(ctx, next){

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



  var demo = {
    "poiProbLv2": {},
    "poiProbLv1": {},
    "type": "location",
    "soundProb": {},
    "motionProb": {},
    "timestamp": 0,
    "raw_logId":"559cd27905986730cc6ce338"
  }


};
