var log = require("../libraries/utils/logger").log;
var logger = new log("<senz.app.log.server>");
var apn = require("apn");
var path = require("path");
var fs = require('fs');
var Wilddog = require("wilddog");
var base_url = "https://notify.wilddogio.com/";
var android_message_ref = new Wilddog(base_url + "/message/");


module.exports = function(UserCollectStrategy) {
    var ios_apn_recorder = {};
    var android_wilddog_recorder = {};
    var default_expire = 6;

    UserCollectStrategy.pushToken = function(req, cb) {
        var installationId = req.installationId;
        var token = req.token;
        UserCollectStrategy.app.models.Installation.findOne({where: {id: installationId}}, function(e, installation){
            if(e || !installation) return cb(e, "Invalid installationId!");

            var data = {
                installationId: installationId,
                expire_init: default_expire,
                expire: default_expire,
                deviceType: installation.deviceType,
                token: token
            };
            UserCollectStrategy.findOrCreate({where: {installationId: installationId}}, data, function(e, strategy){
                if(e) return cb(e, "pushToken Failed!");

                strategy.token = token;
                strategy.save(function(e, d){
                    if(installation.deviceType == "ios"){
                        createApnConnection(installationId);
                    }else if(installation.deviceType == "android"){
                        android_wilddog_recorder[installationId] = d;
                    }
                    return cb(e, "pushToken Success!");
                });
            })
        });
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

    UserCollectStrategy.pushCollectStrategy= function(req, cb){
        var installationId = req.installationId;
        var expire = req.expire || default_expire;

        UserCollectStrategy.app.models.Installation.findOne({where: {id: installationId}}, function(e, installation) {
            if (e || !installation) return cb(e, "Invalid installationId!");

            var data = {
                installationId: installationId,
                expire_init: expire,
                expire: expire,
                deviceType: installation.deviceType
            };
            UserCollectStrategy.findOrCreate({where: {installationId: installationId}}, data, function(e, strategy){
                if(e) return cb(e, "pushCollectStrategy Failed!");

                strategy.expire_init = expire;
                strategy.expire = expire;
                strategy.save(function(e, d){
                    console.log(d);
                    if(installation.deviceType == "ios"){
                        createApnConnection(installationId);
                    }else if(installation.deviceType == "android"){
                        android_wilddog_recorder[installationId] = d;
                    }
                    return cb(e, "pushCollectStrategy Success!");
                });
            })
        });
    };

    var createApnConnection = function(installationId){
        UserCollectStrategy.app.models.Installation.findOne({where: {id: installationId}}, function(e, installation){
            if(e || !installation){
                ios_apn_recorder[installationId] = {};
                return null;
            }

            ios_apn_recorder[installationId] = {};
            logger.debug("###############", installationId);

            UserCollectStrategy.findOne({"installationId": installationId}, function(e, strategy){
                if(e || !strategy || !strategy.token){
                    logger.error("createApnConnection", "Can't create Apn Connection # Retry token");
                    return null;
                }

                UserCollectStrategy.app.models.senz_app.findOne({where: {id: installation.appId}}, function(e, app){
                    if(e || !app.cert || !app.key){
                        logger.error("createApnConnection", "Can't create Apn Connection # Retry upload Cert");
                        return null;
                    }

                    ios_apn_recorder[installationId].device = new apn.Device(strategy.token);
                    ios_apn_recorder[installationId].expire_init = strategy.expire_init || default_expire;
                    ios_apn_recorder[installationId].expire = strategy.expire_init || default_expire;

                    var certPath = path.join(__dirname, '../../storage', installation.appId, "cert.pem");
                    var keyPath = path.join(__dirname, '../../storage', installation.appId, "key.pem");

                    ios_apn_recorder[installationId].apnConnection_prod = new apn.Connection({
                        cert: fs.readFileSync(certPath),
                        key: fs.readFileSync(keyPath),
                        passphrase: app.cert_pass,
                        production: true
                    });
                    ios_apn_recorder[installationId].apnConnection_dev = new apn.Connection({
                        cert: fs.readFileSync(certPath),
                        key: fs.readFileSync(keyPath),
                        passphrase: app.cert_pass
                    });
                    logger.info("createConnection", "Create Connection Success!");
                })
            });
        });
    };

    var pushApnMessage = function(installationId, msg){
        logger.debug("pushApnMessage", "installationId: " + installationId);

        if(!ios_apn_recorder[installationId]) return;

        var apnConnection_prod = ios_apn_recorder[installationId].apnConnection_prod;
        var apnConnection_dev = ios_apn_recorder[installationId].apnConnection_dev;
        var device = ios_apn_recorder[installationId].device;

        var note = new apn.Notification();
        note.contentAvailable = 1;
        note.payload = { "senz-sdk-notify": msg };

        if(apnConnection_dev && device){
            logger.debug("pushApnMessage_dev", JSON.stringify(note));
            apnConnection_dev.pushNotification(note, device);
        }
        if(apnConnection_prod && device){
            logger.debug("pushApnMessage_prod", JSON.stringify(note));
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
            logger.debug("maintainFlag", "installationId: "+installationId);
            logger.debug("maintainFlag", "installation##expire: "+ios_apn_recorder[installationId].expire_init);
            ios_apn_recorder[installationId].expire -= 1;
            if(ios_apn_recorder[installationId].expire <= 0){
                var msg = {"type": "collect_data"};

                pushApnMessage(installationId, msg);
                ios_apn_recorder[installationId].expire =
                    ios_apn_recorder[installationId].expire_init || default_expire;
            }
        });

        Object.keys(android_wilddog_recorder).forEach(function(installationId){
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
        UserCollectStrategy.app.models.Installation.find({order: 'updatedAt DESC'}, function(e, installations){

            var remove_dup = {};
            installations.forEach(function(d){
                if(!remove_dup[d.userId]){
                    remove_dup[d.userId] = d;
                }
            });
            Object.keys(remove_dup).forEach(function(item){
                var installation = remove_dup[item];
                if(installation.deviceType == "android"){
                    android_wilddog_recorder[installation.id] = {};
                    android_wilddog_recorder[installation.id].expire = default_expire;
                }else if(installation.deviceType == "ios"){
                    createApnConnection(installation.id.toString());
                }
            })
        });
    };

    setInterval(maintainFlag, 10000);
    setTimeout(connOnBoot, 100);

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
    UserCollectStrategy.remoteMethod(
        "pushCollectStrategy",
        {
            accepts: {arg: "body", type: "object", http: {source: "body"}},
            returns: {arg: "result", type: "object"}
        }
    );
};
