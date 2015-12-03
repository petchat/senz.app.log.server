var req = require("request");
var uuid = require("uuid");

module.exports = function(Installation) {
    Installation.invent = function(req, cb) {
        var appid = req.body.appid;
        var hardwareId = req.body.hardwareId;
        var deviceType = req.body.deviceType;

        var pattern = '/^' + hardwareId + '/i';
        Installation.app.models.Tracker
            .findOne({username: {$regex: pattern}})
            .then(
                function (object) {
                    if (object) {
                        return Promise.resolve(object);
                    } else {
                        return Promise.resolve(undefined);
                    }
                },
                function (err) {
                    return Promise.reject(err);
                }
            )
            .then(
                function (tracker) {
                    if (tracker) {
                        var user_id = tracker.id;
                        console.log(user_id);
                        return Installation.create({
                            "userId": user_id,
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
                    cb(err);
                    return Promise.reject(err);
                }
            )
            .then(
                function(model){
                    console.log('register success!');
                    cb(null, model);
                    return Promise.resolve(model);
                },
                function(err){
                    console.log('register error!');
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
