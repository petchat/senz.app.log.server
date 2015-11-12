var rabbit = require('wascally');
var configuration = require('./configuration.js');
var log = require("../utils/logger").log;
var logger = new log("rabbitmq pub");


//var env = null;
//if(process.env.APP_ENV === "prod"){
//    env = "_prod"
//
//}else {
//
//    env = "_test"
//}

////
/////
env = "_demo";


publishMsg = function(msg, event) {
    logger.info("",'------ Sending ------');
    logger.info("",'* The chosen event is ' + event + '\n* The content of Msg is ' + JSON.stringify(msg) + '\n* Sending Msg...\n');
    var routing_key = null

  if(event === "new_log_arrival"){
      routing_key = "log"
    }else if(event === "new_crf_status_creation"){
      routing_key = "crf_status"

    }else if(event === "new_hmm_status_creation"){
      routing_key = "hmm_status"

  }

    var type = "senz.message." + routing_key + env;
    logger.info("","event is " + type);
    rabbit.publish(event + env, {
        type: type,
        body: msg
        //routingKey: routing_key
    });
};

exports.publishMessage = function(msg, event){

    console.log("fuck");
    logger.info("","topo is " + JSON.stringify(configuration.topology) );
    rabbit.configure(configuration.topology)
        .then(publishMsg(msg, event));
};

