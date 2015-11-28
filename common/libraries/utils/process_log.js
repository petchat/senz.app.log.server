/**
 * Created by mageia on 15/11/27.
 */
var redis = require("node-redis");
var request = require('request');
var log = require("./logger").log;
var logger = new log("Model Log Hook Module");
var converter = require("./coordinate_trans.js");
var alertist = require("./send_notify.js");


var log_cache = redis.createClient(6379, '127.0.0.1');
log_cache.on("error", function (err) {
    console.log("Error " + err);
});

var get_user_id = function(installationId){

};

var process_location = function(obj){
    if(!obj){
        return null;
    }
    console.log("InstallcationID: ");
    console.log(obj.installationId);

    var processed_obj = {};
    processed_obj['user_id'] = obj.userId;
    processed_obj['location'] = obj.location;
    processed_obj['timestamp'] = obj.timestamp;
    processed_obj['radius'] = obj.locationRadius;
    processed_obj['userRawdataId'] = obj.id;

    return processed_obj;
};
var process_motion = function(obj){
    if(!obj){
        return null;
    }

    var processed_obj = {};
    processed_obj['user_id'] = obj.userId;
    processed_obj['timestamp'] = obj.timestamp;
    processed_obj['userRawdataId'] = obj.id;
    processed_obj["sensor_data"] = {"events": obj.value.events};

    return processed_obj;
};
var process_staticInfo = function(obj){
    if(!obj){
        return null;
    }

    var processed_obj = {};
    processed_obj['user_id'] = obj.userId;
    processed_obj['timestamp'] = obj.timestamp;
    processed_obj['userRawdataId'] = obj.id;
    processed_obj["sensor_data"] = {"events": obj.value.events};

    return processed_obj;
};

var _post_refined_log = function(url, object){
    if(!object){
        logger.error("illegal object");
        return;
    }
    var option = {
        method: 'POST',
        headers: {'content-type' : 'application/json'},
        uri: url,
        json: JSON.stringify(object)
    };
    request(option, function(err, response, body){
        if(err){
            log_cache.set(object.id, 'failed');
        }
    });
};


exports.process_rawLog = function(object){
    var type = object.type;
    var url = 'http://119.254.111.40:3000/api/';
    switch (type)
    {
        case "accSensor":
        case "sensor":
        case "predictedMotion":
            object = process_motion(object);
            url += 'UserMotions';
            break;
        case "mic":
            url += 'ForTests';
            break;
        case "location":
            var installation_object_id = object.id;
            if (installation_object_id == "7EVwvG7hfaXz0srEtPGJpaxezs2JrHft" && Math.random() < 0.2  ){
                var geo_now = {lng: object.location.longitude ,lat: object.location.latitude };
                if(converter.isCoordinateInChaos(geo_now)){
                    alertist.alert_user("shit you");
                }else{
                    console.log("coordinate operated normally")
                }
            }
            object = process_location(object);
            url += 'UserLocatins';
            break;
        case "calendar":
            url += 'UserCalendars';
            break;
        case "application":
            url += 'UserStaticInfo';
            break;
        default:
            url += 'ForTests';
            break;
    }
    _post_refined_log('http://119.254.111.40:3000/api/ForTests', object);
};

