/**
 * Created by zhanghengyang on 15/4/24.
 */

var log = require("../../utils/logger").log;
var logger = new log("[locations]");
var req = require("request");
var m_cache = require("location-cache");
var config = require("../config.json");
var type = require("./lean_type.js");
var AV = require("avoscloud-sdk").AV;
var _ = require("underscore");


var user_log_post = function (url, params) {

    var uuid = params.userRawdataId;
    logger.info(uuid, "User logs post started");
    var promise = new AV.Promise();
    req.post(
        {
            url: url,

            json: params
        },
        function(err,res,body){
            if(err != null || (res.statusCode != 200 && res.statusCode !=201) ) {
                if(_.has(res,"statusCode")){
                    logger.debug(uuid,res.statusCode)
                    promise.reject("Error is " + err + " " + "response code is " + res.statusCode);
                }else{
                    logger.error(uuid,"Response with no statusCode")
                    promise.reject("Error is " + err );
                }
            }
            else {
                var body_str = JSON.stringify(body)
                logger.debug(uuid,"Body is " + body_str);
                promise.resolve("Data save successfully")
            }
        }
    );
    return promise;

};



var load_data = function(body, type, id) {

  var params = {};
  var uuid = id;

  if(type === "location") {
      var poi_prob_per_object = body.results.poi_probability[0];
      //console.log("response results" + typeof json_body);

      var prob_lv1_object = {};
      var prob_lv2_object = {};
      var level_one = Object.keys(poi_prob_per_object);

      level_one.forEach(function (type1) {
        console.log(JSON.stringify(type1));
        prob_lv1_object[type1] = poi_prob_per_object[type1].level1_prob;
        prob_lv2_object = _.extend(prob_lv2_object, poi_prob_per_object[type1].level2_prob);
      });
      delete prob_lv2_object["sum_probability"]
      params["poiProbLv1"] = prob_lv1_object;
      params["poiProbLv2"] = prob_lv2_object;
      logger.debug(uuid, "params are \n" + JSON.stringify(params));

  }else if(type === "mic"){

      if(_.has(body,"ctx_probability")){
        params["soundProb"] = body.ctx_probability;
      }
      else{
        return null;
      }

  }else if(type === "sensor"){

      params["motionProb"] = body.pred[0]; // todo check if given a list..

  }
        //async error catch using domain, although it may cause memory leaks.
        //http://www.alloyteam.com/2013/12/node-js-series-exception-caught/



    return params;
};





var service_post = function (url, params, object) {

    var uuid = object.id;

    logger.debug(uuid,"Params are " + JSON.stringify(params));

    var promise = new AV.Promise();
    req.post(
        {
            url: url,
            //url:"http://httpbin.org/post",
            headers:{
                "X-request-Id":uuid
            },
            json: params

        },
        function(err,res,body){

            logger.debug(uuid, JSON.stringify(res));
            if(err != null ||  (res.statusCode != 200 && res.statusCode !=201) ){
                logger.error(uuid, "Error is " + JSON.stringify(err));
                if(_.has(res,"statusCode")){
                    logger.debug(uuid,res.statusCode)
                }else{
                    logger.error(uuid,"Response with no statusCode")
                }

                promise.reject("Log service request error");
            }
            else{
                var body_str = JSON.stringify(body);
                logger.debug(uuid, "Body is  " + body_str);
                var processed_data = load_data(body, object.type, object.id);

                if(!processed_data){
                    promise.reject("ERROR!,please check the log")
                    return ;
                }
                processed_data["raw_logId"] = object.id;
                processed_data["timestamp"] = object.timestamp;
                processed_data["type"] = object.type;
                processed_data["userId"] = object.userId;
                logger.info(uuid, "data proccessed");
                ///write_in_db body wrapping
                promise.resolve(processed_data);
            }

        }
    );
    return promise;
};



exports.service_post = service_post;
exports.user_log_post = user_log_post;
