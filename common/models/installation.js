var uuid = require("uuid");
var log = require("../libraries/utils/logger").log;
var logger = new log("Model Log Hook Module");

module.exports = function(Installation) {
    Installation.invent = function(req, cb) {
        var appid = req.body.appId;
        var hardwareId = req.body.hardwareId;
        var deviceType = req.body.deviceType;

        Promise.all([
            Installation.app.models.senz_app.findOne({where:{"id": appid}}),
            Installation.app.models.Tracker.findOne({username: {$regex: '/^' + hardwareId + '/mi'}})
        ])
        .then(
            function (results) {
                if(!results[0]) return Promise.reject("Invalid appId");

                return results[1] || Installation.app.models.Tracker.create({
                    "username": hardwareId + "_nologin",
                    "password": uuid.v4(),
                    "email" : "nonexistence" + "@petchat.io"});
            },
            function (err) {
                cb(err);
                return Promise.reject(err);
            }
        )
        .then(
            function (tracker) {
                return Installation.create({
                    "userId": tracker.id,
                    "appId": appid,
                    "hardwareId": hardwareId,
                    "deviceType": deviceType,
                    "deviceToken": uuid.v4()
                })
            },
            function (err) {
                logger.error(hardwareId, err);
                cb(err);
                return Promise.reject(err);
            }
        )
        .then(
            function(model){
                logger.info(model.id, 'register success!');
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
