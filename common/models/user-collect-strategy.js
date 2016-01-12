var log = require("../libraries/utils/logger").log;
var logger = new log("<senz.app.log.server>");
var apn = require("apn");
var Wilddog = require("wilddog");
var base_url = "https://notify.wilddogio.com/";
var android_message_ref = new Wilddog(base_url + "/message/");


module.exports = function(UserCollectStrategy) {
    var ios_apn_recorder = {};
    var android_wilddog_recorder = {};
    var default_expire = 5;

    UserCollectStrategy.pushToken = function(req, cb) {
        var installationId = req.installationId;
        var token = req.token;
        UserCollectStrategy.findOne({where: {installationId: installationId}}, function(e, strategy){
            if(e || !strategy){
                return cb("Invalid installationId!");
            }

            strategy.token = token;
            strategy.save(function(e, d){
                if(e){
                    return cb("pushToken failed!");
                }else{
                    createApnConnection(installationId);
                    return cb("", d);
                }
            });
        })
    };

    UserCollectStrategy.pushApnMessage = function(req, cb){
        var installationId = req.installationId;
        if(!installationId){
            return cb("", "InstallationId Must be NonEmpty!")
        }
        var msg = {"type": req.type, "content": req.content};
        pushApnMessage(installationId, msg);
        return cb("", "pushApnMessage Success!");
    };

    UserCollectStrategy.pushAndroidMessage = function(req, cb){
        var installationId = req.installationId;
        if(!installationId){
           return cb("", "InstallationId Must be NonEmpty!")
        }
        var msg = {"type": req.type, "content": req.content};
        pushAndroidMessage(installationId, msg);
        return cb("", "pushAndroidMessage Success!");
    };

    var get_appid_by_installationid = function(installationId){
        return UserCollectStrategy.app.models.Installation.findOne({where: {id: installationId}})
            .then(
                function(installation){
                    if(!installation) return Promise.reject("Invalid InstallationId!");
                    logger.debug("get_appid_by_installationid", installation.appId);
                    return Promise.resolve(installation.appId);
                })
            .catch(function(e){
                logger.error("get_appid_by_installationid", JSON.stringify(e));
                return Promise.reject(e);
            });
    };

    var createApnConnection = function(installationId){
        return get_appid_by_installationid(installationId)
            .then(
                function(appId){
                    return Promise.all([UserCollectStrategy.findOne({where: {installationId: installationId}}),
                                        UserCollectStrategy.app.models.senz_app.findOne({where: {id: appId}})])
                })
            .then(
                function(result){
                    var strategy = result[0];
                    var senz_app = result[1];

                    if(!strategy || !strategy.token || !senz_app || !senz_app.cert || !senz_app.key){
                        return Promise.reject(result);
                    }

                    if(!strategy.device){
                        strategy.device = new apn.Device(strategy.token);
                    }

                    strategy.expire = strategy.expire_init || default_expire;

                    strategy.apnConnection_prod = new apn.Connection({
                        cert: strategy.cert,
                        key: strategy.key,
                        production: true,
                        passphrase: senz_app.cert_pass
                    });
                    strategy.apnConnection_dev = new apn.Connection({
                        cert: strategy.cert,
                        key: strategy.key,
                        production: false,
                        passphrase: senz_app.cert_pass
                    });

                    strategy.save(function(e, d){
                        ios_apn_recorder[installationId] = strategy;
                    });

                    logger.info("createConnection", JSON.stringify(strategy));
                })
            .catch(
                function(e){
                    return Promise.reject(e);
                });
    };

    var pushApnMessage = function(installationId, msg){
        if(!ios_apn_recorder[installationId]) return;

        var apnConnection_prod = ios_apn_recorder[installationId].apnConnection_prod;
        var apnConnection_dev = ios_apn_recorder[installationId].apnConnection_dev;
        var device = ios_apn_recorder[installationId].device;

        var note = new apn.Notification();
        note.contentAvailable = 1;
        note.payload = {
            "senz-sdk-notify": msg
        };

        if(apnConnection_dev && device){
            apnConnection_dev.pushNotification(note, device);
        }
        if(apnConnection_prod && device){
            apnConnection_prod.pushNotification(note, device);
        }
    };

    var pushAndroidMessage = function(installationId, msg){
        var type = msg.type || "collect_data";
        var content = msg.content || Math.random();
        var collect_data = android_message_ref.child(installationId).child(type);
        collect_data.set(content, function(err){
            if(err){
                logger.error("pushAndroidMessage", JSON.stringify(err));
            }else{
                logger.info("pushAndroidMessage", installationId + ": push success!");
            }
        })
    };

    var maintainFlag = function(){
        Object.keys(ios_apn_recorder).forEach(function(installationId){
            console.log(ios_apn_recorder[installationId]);
            ios_apn_recorder[installationId].expire -= 1;
            if(ios_apn_recorder[installationId].expire <= 0){
                var msg = {"type": "collect_data"};

                pushApnMessage(installationId, msg);
                ios_apn_recorder[installationId].expire =
                    ios_apn_recorder[installationId].expire_init || default_expire;
            }
        });

        Object.keys(android_wilddog_recorder).forEach(function(installationId){
            console.log(installationId);
            android_wilddog_recorder[installationId].expire -= 1;
            if(android_wilddog_recorder[installationId].expire <= 0){
                pushAndroidMessage(installationId, {"type": "collect_data", "content": Math.random()});
                android_wilddog_recorder[installationId].expire =
                    android_wilddog_recorder[installationId].expire_init || default_expire;
            }
        });
        logger.debug("maintainFlag", "Timer Schedule!");
    };

    var connOnBoot = function(){
        UserCollectStrategy.app.models.Installation.find({}, function(e, installations){
            console.log(installations);
            installations.forEach(function(item){
                if(item.deviceType == "android"){
                    android_wilddog_recorder[item.id] = {};
                    android_wilddog_recorder[item.id].expire = 6;
                }else if(item.deviceType == "ios"){
                    createApnConnection(item.id);
                }
            })
        });
    };

    setInterval(maintainFlag, 1000);
    setTimeout(connOnBoot, 0);

    UserCollectStrategy.remoteMethod(
        "pushToken",
        {
            accepts: {arg: "body", type: "object", http: {source: "body"}},
            returns: {arg: "result", type: "object"}
        }
    );
    UserCollectStrategy.remoteMethod(
        "pushApnMessage",
        {
            accepts: {arg: "body", type: "object", http: {source: "body"}},
            returns: {arg: "result", type: "object"}
        }
    );
    UserCollectStrategy.remoteMethod(
        "pushAndroidMessage",
        {
            accepts: {arg: "body", type: "object", http: {source: "body"}},
            returns: {arg: "result", type: "object"}
        }
    );
};
