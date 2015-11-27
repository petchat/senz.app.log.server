var log = require("../libraries/utils/logger").log;
var logger = new log("Model Log Hook Module");
var publisher = require('../libraries/rabbit_lib/publisher');
var converter = require("../libraries/utils/coordinate_trans.js");
var zlib = require("zlib");
var request = require('request');

var log_example = {
    "value": {},
    "type": "location",
    "source": "sdk",
    "locationRadius": 5,
    "timestamp": 1123333444,
    "location": {"lat":39.98057,"lng":116.4385},
    "userId": "559b7e6e2b5f91ab718914b4",
    "installationId": "559cd13c05986730cc6ce337"
};


module.exports = function(Log) {
    Log.observe("before save", function(ctx, next){
    console.log('Saved %s', ctx.Model.modelName);

    var pre_type = ctx.instance.type,
        pre_source = ctx.instance.source,
        pre_location = ctx.instance.location,
        compressed = ctx.instance.compressed;

    if( pre_type == "location" && pre_source == "internal"){
        var backup_location = {"lat":pre_location.latitude, "lng":pre_location.longitude};
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

    Log.observe("after save", function(ctx, next){
        if(ctx.isNewInstance){
            console.log('Saved %s#%s', ctx.Model.modelName, ctx.instance.id);
            var object = ctx.instance;
            var type = ctx.instance.type;
            logger.debug("Log to Rabbitmq", type);
            var url = 'http://119.254.111.40:3000/api/';
            switch (type)
            {
                case "accSensor":
                case "sensor":
                case "predictedMotion":
                    url += 'UserMotions';
                break;
                case "mic":
                    url += 'ForTests';
                break;
                case "location":
                    var installation_object_id = ctx.instance.id;
                    console.log(installation_object_id);
                    url += 'UserLocatins';
                break;
                case "calendar":
                    url += 'UserCalendars';
                break;
                case "application":
                    url += 'UserInfoLog';
                break;
                default:
                break;
            }
            console.log(object);
            var option = {
                method: 'POST',
                headers: {'content-type' : 'application/json'},
                uri: url,
                json: object
            };
            request(option, function(err, response, body){
                console.log('body: ');
                console.log(body);
            });
        }else{
            console.log("updated %s", ctx.Model.pluralModelName)
        }
        next();
    })
};
