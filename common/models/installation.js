var req = require("request");
var uuid = require("uuid");
var log = require("../libraries/utils/logger").log;
var logger = new log("Model Log Hook Module");

module.exports = function(Installation) {
    Installation.invent = function(req, cb) {

        console.log(req.body);
        var appid = req.body.appId;
        var hardwareId = req.body.hardwareId;
        var deviceType = req.body.deviceType;

        Promise.all([
            Installation.app.models.senz_app.findOne({where:{"id": appid}}),
            Installation.app.models.Tracker.findOne({username: {$regex: '/^' + hardwareId + '/m'}})
        ])
        .then(
            function (results) {
                if(!results[0]){
                    return Promise.reject("Invalid appId");
                }else{
                    return Promise.resolve(results[1]);
                }
            },
            function (err) {
                cb(err);
                return Promise.reject(err);
            }
        )
        .then(
            function (tracker) {
                if (tracker) {
                    console.log(tracker.id);
                    return Installation.create({
                        "userId": tracker.id,
                        "appId": appid,
                        "hardwareId": hardwareId,
                        "deviceType": deviceType,
                        "deviceToken": uuid.v4()
                    })
                }else{
                    return Installation.app.models.Tracker
                    .create({
                        "username": hardwareId + "annonymous",
                        "password": "skullfucking your mother",
                        "email" : "fuck" + hardwareId + "@petchat.io"
                    })
                    .then(
                        function(tracker){
                            return Installation.create({
                                "userId": tracker.id,
                                "appId": appid,
                                "hardwareId": hardwareId,
                                "deviceType": deviceType,
                                "deviceToken": uuid.v4()
                            })
                        })
                }
            },
            function (err) {
                logger.error(hardwareId, err);
                cb(err);
                return Promise.reject(err);
            }
        )
        .then(
            function(model){
                logger.info('register success!');
                cb(null, model);
                return Promise.resolve(model);
            },
            function(err){
                logger.error(hardwareId, err);
                cb(err);
                return Promise.reject(err);
            }
        );
    };

    Installation.remoteMethod(
        "invent",
        {
            http: {path: "/invent", verb: "post"},
            accepts: {arg: "body", type: "object", http: {source: "req"}},
            returns: {arg: "result", type: "any"}
        }
    );
};
