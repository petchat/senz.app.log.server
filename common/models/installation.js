var req = require("request");
var S = require("string");
var uuid = require("uuid");
var Promise = require('bluebird');
var AV = require("avoscloud-sdk").AV;

module.exports = function(Installation) {
    //Installation.getApp(function(err, app){
    //    app.models.Log.find({where:{"source":"internal"}},function(err, models){});
    //});

    /////hook
    Installation.observe("after save", function(ctx, next) {
        next();
    });


    ////// function

    var result = null;
    var demo_params = {"hardwareId":"aasdfa",
      "deviceType":"android",
      "appid":"559cd11a05986730cc6ce336"};


    Installation.invent = function(req, cb){
        var appid = req.body.appid;
        var hardwareId = req.body.hardwareId;
        var deviceType = req.body.deviceType;
        console.log("body is ");
        var user_exists_promise = new AV.Promise()
        var user_not_exists_promise = new AV.Promise()
        var loopback_app = null;

        Installation.getApp(function(err, app){
            if(err){
                cb(null,"error")
            }
            loopback_app = app;
            app.models.Tracker.find({where:{}},function(err, objects){
                if(!err){
                    var isUserExists = false;
                    console.log(objects);
                    objects.forEach(function(object){
                        if(S(object.username).startsWith(hardwareId)){
                            isUserExists = true;
                            user_exists_promise.resolve(object);
                            return;
                        }
                    });
                    if(!isUserExists){
                        user_not_exists_promise.resolve("Let's create an user attached to the installation");
                    }
                }else{
                    console.log(err);
                    user_exists_promise.reject(err);
                }
            });
        });

        user_exists_promise.then(
            function(object){
                var user_id = object.id;

                Installation.create({
                    "userId":user_id,
                    "appId": appid,
                    "hardwareId": hardwareId,
                    "deviceType": deviceType,
                    "installationId":uuid.v4(),
                    "deviceToken":uuid.v4()
                }, function(err, models){
                    if(!err){
                        console.log("fuck here");
                        var response = models;
                        cb(null,response)
                    }
                    else{
                        console.log(err);
                        cb(null,"installation creation error")
                    }
                })
            },
            function(err){
                console.log(err)
            });

        user_not_exists_promise.then(
            function(){
                loopback_app.models.Tracker.create({
                    "username": hardwareId + "annonymous",
                    "password": "skullfucking your mother",
                    "email" : "fuck" + hardwareId + "@petchat.io"
                },function(err, models){
                      if(!err){
                          var new_user_id = models.id;

                          Installation.create({
                              "userId": new_user_id,
                              "hardwareId": hardwareId,
                              "deviceType": deviceType,
                              "appId": appid
                          }, function(err, models){
                              if(!err){
                                var response = models;
                                //id is installation id
                                cb(null,response)
                              }
                              else{
                                console.log(err);
                                cb(null, err)
                              }
                          })
                      }else{
                          cb(null, err)
                      }
                })
            },
            function(err){
            cb(null, "error")
          }
        )};



    Installation.remoteMethod(
      "invent",
      {
        http: {path:"/invent", verb: "post"},
        accepts: { arg: "body", type: "object", http:{ source:"req"} },
        returns: { arg: "result" ,type:"any"}
      }
    );
};
