var log = require("../libraries/utils/logger").log;
var logger = new log("Model Log Hook Module");
var publisher = require('../libraries/rabbit_lib/publisher');
var converter = require("../libraries/utils/coordinate_trans.js")

var log_example = {
  "value": {},
  "type": "location",
  "source": "sdk",
  "locationRadius": 5,
  "timestamp": 1123333444,
  "location": {"lat":39.98057,"lng":116.4385},
  "userId": "559b7e6e2b5f91ab718914b4",
  "installationId": "559cd13c05986730cc6ce337"
}


module.exports = function(Log) {

  Log.observe("before save", function(ctx, next){

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


  var pre_type = ctx.instance.type,
      pre_source = ctx.instance.source,
      pre_location = ctx.instance.location

  if( pre_type == "location" && pre_source == "internal"){
    c_location = converter.toBaiduCoordinate(pre_location.lng, pre_location.lat)
    source = "baidu offline converter"
    location = pre_location

    ctx.instance.location = {"lat": c_location.lat, "lng": c_location.lng}
    ctx.instance.source = source
  }

  next();


  });



  Log.observe("after save", function(ctx, next){
    if(ctx.isNewInstance){
      console.log('Saved %s#%s', ctx.Model.modelName, ctx.instance.id);
      // log to rabbitmq  begin
      //
      var object = ctx.instance;

      var type = ctx.instance.type;
      logger.debug("Log to Rabbitmq", type);
      if(type == "location" || type == "sensor" || type == "mic"){

        logger.info("Log to Rabbitmq",'There is a new ' + type +  ' comming.');
        msg = object;
        logger.info("Log to Rabbitmq",'The new log object id: ' + object.id);
        publisher.publishMessage(msg, 'new_log_arrival');

      }

      //
      // log to rabbitmq end

    }
    else{
      console.log("updated %s",ctx.Model.pluralModelName)

    }
    next();
  })


};
