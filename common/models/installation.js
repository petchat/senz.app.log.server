var uuid = require("uuid");
var log = require("../libraries/utils/logger").log;
var logger = new log("Model Log Hook Module");


module.exports = function(Installation) {
    Installation.invent = function(req, cb) {
        var appId = req.appId;
        var hardwareId = req.hardwareId;
        var deviceType = req.deviceType;

        logger.debug("invent", hardwareId + " " + appId);

        Promise.all([
            Installation.app.models.senz_app.findOne({where:{"id": appId}}),
            Installation.app.models.Tracker.findOne({where:{"hardwareId": hardwareId}})
        ])
        .then(
            function (results) {
                if(!results[0]) return Promise.reject("Invalid appId");

                return results[1] || Installation.app.models.Tracker.create({
                    "username": hardwareId + "_nologin",
                    "hardwareId": hardwareId,
                    "password": uuid.v4(),
                    "email" : "nonexistence" + "@petchat.io"});
            })
        .then(
            function (tracker) {
                Installation.create({
                    "userId": tracker.id,
                    "appId": appId,
                    "hardwareId": hardwareId,
                    "deviceType": deviceType,
                    "deviceToken": uuid.v4()
                }, function(err, model){
                    return cb(err, model);
                })
            })
        .catch(
            function(err){
                logger.error(hardwareId, err);
                return cb(err);
            }
        );
    };

    Installation.remoteMethod(
        "invent",
        {
            http: {path: "/invent", verb: "post"},
            accepts: {arg: "body", type: "object", http: {source: "body"}},
            returns: {arg: "result", type: "object"}
        }
    );
};
