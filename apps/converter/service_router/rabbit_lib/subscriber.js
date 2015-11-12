var rabbit = require('wascally');
var configuration = require('./configuration.js');
var log = require("../utils/logger").log;
var logger = new log("[rabbitMQ]");




//var env = null;
//if(process.env.APP_ENV === "prod"){
//    env = "_prod"
//
//}else{
//
//    env = "_test"
//}

env = "_demo"


function handleMessage(callback,type){
    //setting up the handler for the subscriber
    var final_type = "senz.message." + type + env ;
    rabbit.handle(final_type, function(msg) {
        try {
            logger.info("",'* Received Msg from event.');
            callback(msg.body);
            msg.ack();
        }
        catch( err ) {
            msg.nack();
        }
    });
    logger.info("",'------ Receiving ------');
    logger.info("",'* Waiting for Msg from publisher.');
}

exports.registerEvent = function(callback, consumer_name, raw_event){
    var event = raw_event + env;
    var config = configuration.topology;
    config['queues'][config['queues'].length] = { name: consumer_name + env, subscribe: true};
    config['bindings'][config['bindings'].length] = { exchange: event , target: consumer_name + env  };//,keys: '' };
    var routing_key = "log"
    rabbit.configure(config)
        .then(handleMessage(callback,routing_key));
};
