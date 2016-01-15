var uuid = require("uuid");
var log = require("../libraries/utils/logger").log;
var logger = new log("Model Log Hook Module");


module.exports = function(Installation) {
    Installation.invent = function(req, cb) {
        var appId = req.appId;
        var hardwareId = req.hardwareId;
        var deviceType = req.deviceType;

        logger.debug("invent", hardwareId + " " + appId);

        Installation.app.models.senz_app.findOne({where:{"id": appId}}, function(e, app){
            if(e || !app) {return cb(e, "Invalid appId");}

            var user = {
                "username": hardwareId,
                "password": uuid.v4(),
                "email" : "nonexistence" + "@petchat.io"
            };
            Installation.app.models.Tracker.findOrCreate({where:{"username": hardwareId}}, user, function(e, tracker){
                if(e) return cb(e, "invent Failed");

                Installation.create({
                    "userId": tracker.id.toString(),
                    "appId": appId,
                    "hardwareId": hardwareId,
                    "deviceType": deviceType,
                    "deviceToken": uuid.v4()
                }, function(err, installation){
                    logger.info(err, "Create New Installation: " + installation.id);
                    return cb(err, {installationId: installation.id,
                        userId: installation.userId});
                });

                    //if(e || !tracker){
                    //    Installation.app.models.Tracker.create({
                    //        "username": hardwareId,
                    //        "password": uuid.v4(),
                    //        "email" : "nonexistence" + "@petchat.io"},
                    //        function(e, tracker){
                    //            Installation.create({
                    //                "userId": tracker.id.toString(),
                    //                "appId": appId,
                    //                "hardwareId": hardwareId,
                    //                "deviceType": deviceType,
                    //                "deviceToken": uuid.v4()
                    //            }, function(err, installation){
                    //                logger.info(err, "Create New Installation: " + installation.id);
                    //                return cb(err, {installationId: installation.id,
                    //                                userId: installation.userId});
                    //            })
                    //        });
                    //}else{
                    //    logger.info(e, "Use The Exist Tracker!");
                    //    Installation.create({
                    //        "userId": tracker.id.toString(),
                    //        "appId": appId,
                    //        "hardwareId": hardwareId,
                    //        "deviceType": deviceType,
                    //        "deviceToken": uuid.v4()
                    //    }, function(err, installation){
                    //        logger.info(err, "Create New Installation: " + installation.id);
                    //        return cb(err, {installationId: installation.id,
                    //            userId: installation.userId});
                    //    })
                    //}
            })
        });
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
