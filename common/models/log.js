var log = require("../libraries/utils/logger").log;
var logger = new log("Model Log Hook Module");
var converter = require("../libraries/utils/coordinate_trans.js");
var alertist = require("../libraries/utils/send_notify.js");
var process = require("../libraries/utils/process_log.js");
var zlib = require("zlib");
var request = require('request');
var redis = require("node-redis");
var _ = require("underscore");
var app = require('../../server/server');

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
            var backup_location = {"lat": pre_location.lat, "lng": pre_location.lng};
            var c_location = converter.toBaiduCoordinate(pre_location.lng, pre_location.lat);
            var source = "baidu offline converter";
            ctx.instance.location = {"lat": c_location.lat, "lng": c_location.lng};
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


    var deviceType = "";
    var userId = "";
    Log.observe("after save", function(ctx, next){
        if(ctx.isNewInstance){
            console.log('Saved %s#%s', ctx.Model.modelName, ctx.instance.id);
            Log.getApp(function(err, app){
                app.models.Installation.findOne({"_id": ctx.instance.installationId}, function(err, object){
                    if(err){
                        logger.error('installation', 'invalid installationId');
                    }else{
                        logger.debug('devicetype', deviceType);
                        logger.debug('devicetype', userId);
                        deviceType = object.deviceType;
                        userId = object.userId;
                    }
                })
            });
            logger.info('tst', ctx.instance.installationId)
            logger.info('tst', userId)
            logger.info('tst', deviceType)
            process_rawLog(ctx.instance);
        }else{
            console.log("updated %s", ctx.Model.pluralModelName)
        }
        next();
    });

    var post_refined_log = function(url, object){
        request.post(
            {
                url: url,
                headers:{ 'content-type' : 'application/json'},
                json: JSON.stringify(object)
            },
            function(err, res, body){
                if(err){
                    logger.debug('refinedlog', body);
                    return Promise.resolve(body);
                }else {
                    return Promise.reject(err);
                }
            }
        )
    };

    var request_static_info = function(params){
        var url = "https://api.trysenz.com/apps/user_categorizer/predict_platform";
        var auth_key = "5548eb2ade57fc001b000001190f474a930b41e46b37c08546fc8b6c";
        var uuid = params.userRawdataId;

        logger.info(uuid, "static info service post started");
        request.post(
            {
                url: url,
                headers:{
                    "X-request-Id":uuid,
                    "X-senz-Auth": auth_key
                },
                json: params
            },
            function(err, res, body){
                if(err != null || (res.statusCode != 200 && res.statusCode != 201 || body.code == 1)){
                    if(_.has(res, "statusCode")){
                        logger.debug(uuid,res.statusCode);
                        logger.error(uuid, body.detail);
                    }else{
                        logger.error(uuid,"Response with no statusCode");
                        logger.error(uuid, body.detail);
                    }
                    return Promise.reject("Error is " + err );
                }else{
                    var body_str = JSON.stringify(body);
                    logger.debug(uuid,"Body is " + body_str);
                    return Promise.resolve("Error is " + err );
                }
            }
        )
    };

    var process_rawLog = function(object){
        var type = object.type;
        var processed_obj = {};
        var url = 'http://119.254.111.40:3000/api/';
        switch (type)
        {
            case "accSensor":
            case "sensor":
            case "predictedMotion":
                processed_obj['user_id'] = object.userId;
                processed_obj['timestamp'] = object.timestamp;
                processed_obj['userRawdataId'] = object.id;
                processed_obj["sensor_data"] = {"events": object.value.events};
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
                        console.log("coordinate operated normally");
                    }
                }
                processed_obj['user_id'] = object.userId;
                processed_obj['timestamp'] = object.timestamp;
                processed_obj['userRawdataId'] = object.id;
                processed_obj["sensor_data"] = {"events": object.value.events};
                url += 'UserLocatins';
                break;
            case "calendar":
                url += 'UserCalendars';
                break;
            case "application":
                Promise.resolve(userId, deviceType)
                    .then(
                    function(userId, deviceType){
                        var body = {};
                        if(deviceType == "android"){
                            body.platform = "Android";
                        }else if(deviceType == "ios"){
                            body.platform = "IOS";
                        }
                        body.userId = userId;
                        body.userRawdataId = object.id;
                        body.applist = object.value.packages;
                        body.timestamp = object.timestamp;
                        return request_static_info(body);
                    },
                    function(err){
                        logger.error(object.id, "User Id requested into failure");
                        return Promise.reject(err);
                    }
                ).then(
                    function(staticInfo){
                        logger.debug(object.id, JSON.stringify(staticInfo));
                        processed_obj.applist = object.value.packages;
                        processed_obj.user_id = user_id;
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
                ).catch(
                    function(err){
                        logger.error('err', err);
                        return Promise.reject(err);
                    }
                );
                break;
            default:
                processed_obj = object;
                url += 'ForTests';
                break;
        }
    };

    Log.getApp = function(cb){
        var err = null;
        var app = Log.app;
        cb(err, app);
    };

    Log.remoteMethod(
        'getApp',{}
    );
};
