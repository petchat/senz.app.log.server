var log = require("../libraries/utils/logger").log;
var logger = new log("<senz.app.log.server>");
var apn = require("apn");

var ios_apn_recorder = {};


module.exports = function(UserCollectStrategy) {
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
                    return cb("update failed!");
                }
                return cb(e, d);
            });
        })
    };

    UserCollectStrategy.uploadCert = function(req, cb){
        console.log(req.fileUpload);
        cb();
    };

    var get_userid_by_installationid = function(installationId){
        Log.app.models.Installation.findOne({where: {id: installationId}})
            .then(
                function(installation){
                    if(!installation) return Promise.reject("Invalid InstallationId!");

                    return Promise.resolve(installation.userId);
                })
            .catch(function(e){
                logger.error("get_userid_by_installationid", JSON.stringify(e));
                return Promise.reject(e);
            });
    };

    var createConnection = function(installationId){
        Log.app.models.UserCollectStrategy.findOne({where: {installationId: installationId}})
            .then(
                function(strategy){
                    if(!strategy || !strategy.token || !strategy.cert || !strategy.key){
                        return Promise.reject(strategy);
                    }

                    if(!strategy.device){
                        strategy.device = new apn.Device(strategy.token);
                    }

                    if(!strategy.expire){
                        strategy.expire = 10*60;
                    }

                    strategy.apnConnection_prod = new apn.Connection({
                        cert: strategy.cert,
                        key: strategy.key,
                        production: true,
                        passphrase: strategy.passpharse
                    });
                    strategy.apnConnection_dev = new apn.Connection({
                        cert: strategy.cert,
                        key: strategy.key,
                        production: false,
                        passphrase: strategy.passpharse
                    });

                    strategy.save();
                    ios_apn_recorder[installationId] = strategy;
                })
            .catch(
                function(e){
                    logger.error("createConnection", JSON.stringify(e));
                    return Promise.reject(e);
                });
    };

    UserCollectStrategy.remoteMethod(
        "pushToken",
        {
            accepts: {arg: "body", type: "object", http: {source: "body"}},
            returns: {arg: "result", type: "object"}
        }
    );
    UserCollectStrategy.remoteMethod(
        "uploadCert",
        {
            http: {path: "/uploadCert", verb: "post"},
            accepts: {arg: "body", type: "object"},
            returns: {arg: "result", type: "object"}
        }
    );
};
