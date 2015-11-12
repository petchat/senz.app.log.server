/**
 * Created by zhanghengyang on 15/4/23.
 */

var log = require("../utils/logger").log;
var logger = new log("[locations]");
var config = require("./config.json");
var url_generator = require("../utils/url_generator");
var m_cache = require("location-cache");
var req_lib = require("./lib/http_wrapper");
var AV = require("avoscloud-sdk").AV;




var get_request_body = function(obj){
    /// batch request body for poi service
   var body = {};
    if(obj.type === "location") {
        var locations = [];
        var new_loc = {};
        new_loc["latitude"] = obj.location.lat;
        new_loc["longitude"] = obj.location.lng;
        new_loc["__type"] = "GeoPoint";

        var new_obj = {};
        new_obj["timestamp"] = obj.timestamp;
        new_obj["objectId"] = obj.id;
        new_obj["location"] = new_loc;
        new_obj["radius"] = obj.locationRadius;

        locations.push(new_obj);

        body = {"user_trace": locations};
        body.userId = obj.userId;
        body.dev_key = "senz";
        return body

    }else if(obj.type === "mic"){
        body = {
        //todo change to the soundUrl
          "objectId": obj.id,
          "soundUrl": obj.url,
          "userId": obj.userId,
          "timestamp": obj.timestamp
        }


    }else if(obj.type === "accSensor"){
        body["objectId"] = obj.id
        body["timestamp"] = obj.timestamp;
        body["objectId"] = obj.id;// here save the object Id for latter operation
        body["rawData"] = obj.value.events;

    }

};


var get_log_probability = function(body, url, object){

    /// 3 max retries
    console.log(url);
    //http batch request
    return req_lib.service_post(url, body, object);
    //var sound_post = function(url,params,success_cbk,max_timeout){

}


var succeeded = function(suc_id){

    m_cache.del(suc_id);

};



var delete_obj = function(values,id){

    if (values.tries >= 3) {

        m_cache.del(id);
        logger.debug(id, "exhausted id is ," + id);
        return true;

    }
    else{
        logger.debug(id, "the id is not exhausted");
        return false;
    }
};

var check_exhausted = function(id){

    var r = false;
    if(!m_cache.get(id)){
        return true; // for if the id has been deleted by other process, it means the same as tries > 3 and being deleted in the context
    }
    try{
        r = delete_obj(m_cache.get(id),id);
    }
    catch(e){
        var inner_error = "error is " + e + ", if the error is due to the cache confliction, IGNORE"
        logger.error(id, inner_error);
        return true; // for if the id has been deleted by other process, it means the same as tries > 3 and being deleted in the context
    }
    //var r = JSON.stringify(m_cache.get(id));
    //logger.error(r);


    return r;
};


function failed(request_id) {

    if(!m_cache.get(request_id)) {
        return;
    }
    try {
        m_cache.get(request_id).tries += 1;
    }
    catch(e){
        var inner_error = "Error is " + e + ", if the error is due to the cache confliction, IGNORE"
        logger.error(request_id, inner_error);
    }
}

var start = function(log){

    logger.info(log.id, "Task start ...");
    if (typeof log != typeof {} ) {
        logger.error(log.id, "Type of requestId is illegal");
        return;
    }
    //

    if(check_exhausted(log.id)) {
        logger.warn(log.id, "Retries too much, throw the id's request")
        return ;
    };

    var serv_url = null;
    var body = get_request_body(log);
    if(log.type === "location"){
      serv_url = url_generator.location_url
    }else if(log.type === "sensor"){
      serv_url = url_generator.motion_url
    }else if(log.type === "mic"){
      serv_url = url_generator.sound_url
    }

    var service_promise = get_log_probability(body, serv_url, log);
    service_promise.then(
        function (body) {
            logger.info(log.id, "Location service requested successfully");
            return req_lib.user_log_post(url_generator.user_log_url, body);
        },
        function (error) {
            logger.error(log.id, error);
            logger.error(log.id, "Location service requested into failure");
            return AV.Promise.error(error);

        }
    ).then(
        function(result){
            logger.info(log.id, "Data have been written")
            succeeded(log.id);
            logger.info(log.id, "One process end ");

        },
        function(error){
            logger.error(log.id, JSON.stringify(error))
            logger.error(log.id, "Data writing failed ")
            failed(log.id);
        }
    )




    };


exports.start = start ;
