var log = require("../libraries/utils/logger").log;
var logger = new log("Model Log Hook Module");
var converter = require("../libraries/utils/coordinate_trans.js");
var zlib = require("zlib");
var request = require('request-promise');
var redis = require("redis");
var _ = require("underscore");
var loopback = require('loopback');

var log_example = {
    "value": {"events": "test"},
    "type": "location",
    "source": "sdk",
    "locationRadius": 5,
    "timestamp": 1123333444,
    "location": {"lat":39.98057,"lng":116.4385},
    "userId": "559b7e6e2b5f91ab718914b4",
    "installationId": "559cd13c05986730cc6ce337"
};

var log_cache = redis.createClient(6379, '127.0.0.1');
log_cache.on("error", function (err) {
    console.log("Error " + err);
});


module.exports = function(Log) {
    Log.observe("before save", function(ctx, next){
        console.log('Saved %s', ctx.Model.modelName);
        var pre_type = ctx.instance.type,
            pre_source = ctx.instance.source,
            pre_location = ctx.instance.location,
            compressed = ctx.instance.compressed;

        if( pre_type == "location" && pre_source == "internal"){
            var backup_location = {"lat": pre_location.lat||pre_location.latitude,
                                    "lng": pre_location.lng||pre_location.longitude};
            var c_location = converter.toBaiduCoordinate(pre_location.lng||pre_location.longitude,
                                                        pre_location.lat||pre_location.latitude);
            var source = "baidu offline converter";

            ctx.instance.location = new loopback.GeoPoint({lat: c_location.lat||c_location.latitude,
                                                            lng: c_location.lng||c_location.longitude});
            ctx.instance.source = source;
            ctx.instance.pre_location = backup_location;
        }
        if ( (pre_type == "accSensor" || pre_type ==  "magneticSensor" || pre_type == "sensor")
            && (compressed == "gzip" || compressed == "gzipped") ){

            var pre_value = ctx.instance.value;
            var compressed_base64_string = pre_value.events;
            var buffer = new Buffer(compressed_base64_string, "base64");
            zlib.unzip(buffer,function(err, buffer){
                if(!err) {
                    pre_value.events = JSON.parse(buffer.toString());
                    ctx.instance.compressed = "ungzipped";
                    ctx.instance.value = pre_value;
                }
            })
        }
        next();
    });

    Log.observe("after save", function(ctx, next){
        if(ctx.isNewInstance){
            console.log('Saved %s#%s', ctx.Model.modelName, ctx.instance.id);
            get_user_id(ctx.instance)
                .then(
                    function(dic){
                        return process_rawLog(dic);
                    },
                    function(err){
                        logger.error(ctx.instance.id, "process object failed in after save!");
                        return Promise.reject(err);
                    })
                .then(
                    function(){
                        logger.info(ctx.instance.id, "process object success in after save!");
                        return Promise.resolve({});
                    },
                    function(err){
                        logger.error(ctx.instance.id, "process object failed in after save!");
                        log_cache.sadd('RawLog', ctx.instance.id);
                        return Promise.reject(err);
                    });
            }
        next();
    });

    var get_user_id = function(LogObj){
        logger.info('get_user_id', 'LogObj.installationId: ' + LogObj.installationId);
        return Log.app.models.Installation.findOne({where: {"id": LogObj.installationId}})
            .then(
                function(installation){
                    if(!installation) return Promise.reject("Invalid InstallationId!");

                    return Promise.resolve({userId: installation.userId,
                                            deviceType: installation.deviceType,
                                            logObj: LogObj});
                },
                function(err){
                    logger.error('get_user_id', 'query installation failed!');
                    log_cache.sadd('RawLog', LogObj.id);
                    return Promise.reject(err);
                }
            );
        };

    var process_rawLog = function(params){
        var object = params.logObj;
        var type = object.type;
        var pre_obj = {};
        var processed_obj = {};
        var url = 'http://119.254.111.40:3000/api/';
        switch (type)
        {
            case "sensor":
            case "predictedMotion":
            case "accSensor":
                logger.debug('type', type);
                pre_obj = {};
                pre_obj.rawData = object.value.events;
                pre_obj.objectId = object.id;
                pre_obj.timestamp = object.timestamp;
                return request_motion_type(pre_obj)
                    .then(
                        function(motion_data){
                            motion_data.user_id = params.userId;
                            url += 'UserMotions';
                            return post_refined_log('http://119.254.111.40:3000/api/ForTests', motion_data);
                        },
                        function(err){
                            logger.error(object.id, "UserMotion service requested in fail");
                            return Promise.reject(err);
                        });
                break;
            case "mic":
                url += 'ForTests';
                break;
            case "location":
                console.log(object.location);
                var installation_object_id = object.id;
                if (installation_object_id == "7EVwvG7hfaXz0srEtPGJpaxezs2JrHft" && Math.random() < 0.2  ){
                    var geo_now = {lng: object.location.lng||object.location.longitude ,
                                    lat: object.location.lat||object.location.latitude };
                    if(converter.isCoordinateInChaos(geo_now)){
                        alertist.alert_user("shit you");
                    }else{
                        console.log("coordinate operated normally");
                    }
                }
                pre_obj = {};
                pre_obj.location = object.location;
                pre_obj.objectId = object.id;
                pre_obj.userId = params.userId;
                pre_obj.timestamp = object.timestamp;
                pre_obj.radius = object.locationRadius;
                return request_location_type(pre_obj)
                    .then(
                        function(location_type){
                            location_type.user_id = params.userId;
                            url += 'UserLocatins';
                            return post_refined_log('http://119.254.111.40:3000/api/ForTests', location_type);
                        },
                        function(err){
                            logger.error(object.id, "UserLocation service requested in fail");
                            return Promise.reject(err);
                        });
                break;
            case "calendar":
                url += 'UserCalendars';
                break;
            case "application":
                pre_obj = {};
                if(params.deviceType == "android"){
                    pre_obj.platform = "Android";
                }else if(params.deviceType == "ios"){
                    pre_obj.platform = "IOS";
                }
                pre_obj.userId = params.userId;
                pre_obj.userRawdataId = object.id;
                pre_obj.applist = object.value.packages;
                pre_obj.timestamp = object.timestamp;
                return request_static_info(pre_obj)
                .then(
                    function(staticInfo){
                        processed_obj = {};
                        processed_obj.applist = object.value.packages;
                        processed_obj.user_id = params.userId;
                        processed_obj.staticInfo = staticInfo;
                        processed_obj.timestamp = object.timestamp;
                        processed_obj.userRawdataId = object.id;
                        url += 'UserStaticInfo';
                        return post_refined_log('http://119.254.111.40:3000/api/ForTests', processed_obj);
                    },
                    function(err){
                        logger.error(object.id, "Static info service requested in fail");
                        return Promise.reject(err);
                    }
                );
                break;
            default:
                break;
        }
    };

    var post_refined_log = function(url, object){
        request.post(
            {
                url: url,
                json: object
            })
            .then(
                function(body) {
                    logger.debug(object.userRawdataId, "post RefinedLog success");
                    return Promise.resolve(body);
                },
                function(err){
                    logger.error(object.userRawdataId, "POST RefinedLog Failed!");
                    return Promise.reject(err);
                }
            )
    };

    var request_static_info = function(params){
        var url = "https://api.trysenz.com/apps/user_categorizer/predict_platform";
        var auth_key = "5548eb2ade57fc001b000001190f474a930b41e46b37c08546fc8b6c";
        var uuid = params.userRawdataId;

        logger.info(uuid, "static info service post started");
        return request.post(
            {
                url: url,
                headers:{
                    "X-request-Id":uuid,
                    "X-senz-Auth": auth_key
                },
                json: params
            })
            .then(
                function(body){
                    return Promise.resolve(body);
                },
                function(err){
                    return Promise.reject("Error is " + err );
                }
            )
    };

    var load_location_data = function(body, objectId, timestamp){
        var params = {};
        if(!_.has(body.results, "poi_probability")){
            logger.error(uuid,"Error is " + "key error and the error object is " + JSON.stringify(body.results));
            return;
        }
        var near_home_office = body.home_office_label;
        var poi_probability = body.results.poi_probability[0];
        var uuid = objectId;
        //console.log("response results" + typeof json_body);
        if(typeof poi_probability !== typeof {} ){
            logger.error(uuid,"Error is " + "Type error and the error object is " + JSON.stringify(body.results));
            return;
        }
        var userRawdataId = objectId;
        var poiProbLv1, poiProbLv2;
        var prob_lv1_object = {};
        var prob_lv2_object = {};
        var level_one = Object.keys(poi_probability);

        level_one.forEach(function(type1){
            var type1_obj = poi_probability[type1];
            prob_lv1_object[type1] = type1_obj.level1_prob;
            prob_lv2_object = _.extend(prob_lv2_object,type1_obj.level2_prob);
        });

        var address = body.results.pois[0].address;


        params["pois"] = body.results.pois[0];
        //params["isTrainingSample"] = config.is_sample;
        params["userRawdataId"] = userRawdataId;
        params["timestamp"] = timestamp;
        params["processStatus"] = "untreated";
        params["poiProbLv1"] = prob_lv1_object;
        params["poiProbLv2"] = prob_lv2_object;
        params["near_home_office"] = near_home_office;
        _.extend(params, address);

        //logger.debug(uuid,"params are \n" + JSON.stringify(params));

        return params;
    };

    var request_location_type = function(params){
        var locations = [];
        var new_obj = {};
        new_obj["timestamp"] = params.timestamp;
        new_obj["objectId"] = params.objectId;

        new_obj["location"] = new loopback.GeoPoint({lat: params.location.lat||params.location.latitude,
                                                    lng: params.location.lng||params.location.longitude});
        new_obj["radius"] = params.radius;
        locations.push(new_obj);

        var req_body = {"user_trace": locations};
        req_body.dev_key = "senz";
        req_body.userId = params.userId;

        var url = "http://api.trysenz.com/productivity/parserhub/locationprob/";
        var uuid = params.objectId;
        logger.debug(uuid, "Params are " + JSON.stringify(req_body));
        return request.post(
            {
                url: url,
                headers:{
                    "X-request-Id": uuid
                },
                json: req_body
            })
            .then(
                function(body){
                    var processed = load_location_data(body, uuid, req_body.user_trace[0].timestamp);
                    processed["location"] = req_body.user_trace[0].location;
                    processed["radius"] = req_body.user_trace[0].radius;
                    return Promise.resolve(processed);
                },
                function(err){
                    logger.error(uuid, JSON.stringify(err));
                    return Promise.reject(JSON.stringify(err));
                }
            )
    };

    var load_motion_data = function(body){
        var params = {};
        params["processStatus"] = "untreated";
        params["motionProb"] = body.pred[0]; // todo check if given a list..
        params["isTrainingSample"] = 0;
        return params;
    };

    var request_motion_type = function(params){
        var url = "https://api.trysenz.com/utils/motion_detector/";
        var uuid = params.objectId;

        logger.debug(uuid, "request motion type");
        return request.post(
            {
                url: url,
                headers:{
                    "X-request-Id": uuid
                },
                json: params
            })
            .then(
                function(body){
                    var processed_data = load_motion_data(body);
                    processed_data["timestamp"] = params.timestamp;
                    processed_data["userRawdataId"] = params.objectId;
                    processed_data["sensor_data"] = {"events":params.rawData};
                    return Promise.resolve(processed_data);
                },
                function(err){
                    logger.error(uuid, "motion service request error");
                    return Promise.reject(err);
                }
            )
    };

    var processing_error = function(){
        log_cache.smembers('RawLog', function(e, log_list){
            log_list.forEach(function(logId){
                log_cache.srem('RawLog', logId);
                return Log.findOne({"id": logId})
                    .then(
                        function(log){
                            logger.debug('type', log.type);
                            return get_user_id(log);
                        },
                        function(err){
                            logger.error('processing_err', "cannot find the Log instance!");
                            return Promise.reject(err);
                        })
                    .then(
                        function(dic){
                            return process_rawLog(dic);
                        },
                        function(err){
                            logger.error('processing_err', "catched error after get installation object!");
                            return Promise.reject(err);
                        })
                    .then(
                        function(){
                            logger.info('processing_err', "post RefinedLog success!");
                            return Promise.resolve();
                        },
                        function(err){
                            logger.error('processing_err', "catched error after post RefinedLog!");
                            log_cache.sadd('RawLog', logId);
                            return Promise.reject(err);
                        }
                    );
            });
        });

    };

    //setInterval(processing_error, 60000);
};
