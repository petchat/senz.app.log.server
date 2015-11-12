/**
 * Created by zhanghengyang on 15/4/22.
 */

var sub = require('../rabbit_lib/subscriber');
var m_cache = require("location-cache");
var m_task = require("./do_task");
var interval = require("./lib/interval");
var task_interval = interval.task_interval.check_interval;
var log = require("../utils/logger").log;
var logger = new log("[locations]");

var config = require("./config.json");
var AV = require("avoscloud-sdk").AV;
AV.initialize(config.source_db.APP_ID,config.source_db.APP_KEY);
var Fail = AV.Object.extend("Failed");


///*
//A new motion rawdata arrival called 'new_motion_arrival'
//A new sound rawdata arrival called 'new_sound_arrival'.
//    A new location rawdata arrival called 'new_location_arrival'.



var event = "new_log_arrival";
var queue_name = "log_queue";



exports.init = function(){

    //
    sub.registerEvent(logCallback, queue_name, event);
    logger.info("","now listening to the rabbitmq ...")
    logger.info("","Scheduler start ...");
    logger.debug("","Interval is " + task_interval);
    //todo scheduleCleanFromLeanCloud();


    //todo scheduleCleanFromLeanCloud();


};

var logCallback = function(log_object)
{
    console.log("fuck your mother");
    if(m_cache.get(log_object.id)){
        return ;
    }
    logger.info(log_object.id, "a new location data arrived");
    var obj = {};
    obj["object"] = log_object;
    obj["tries"] = 0;
    obj["user"] = {};
    m_cache.put(log_object.id,obj);

    //logger.error("debug here");
    //logger.warn("request new id service started, id >>" + id);
    m_task.start(log_object);


}

//var scheduleCleanFromMemoryCache = function(){
//
//
//    setInterval(
//        function () {
//            if(m_cache.size()>0){
//                var keys = m_cache.keys();
//                var id = keys.pop();
//                var tries = m_cache.get(id).tries;
//                if(tries>0){
//                    logger.warn(id,"the id " + id + "tried" + m_cache.get(id).tries+ " times");
//                    logger.warn(id,"request pre-failed id service started, id >>" + id);
//                    m_task.start(m_cache.get(id).object);
//                }
//            }
//
//        },task_interval);
//
//};

//var scheduleCleanFromLeanCloud = function(){
//
//    var rule = new timer.RecurrenceRule();
//    //todo add the failing ids to the memory cache to check for 3 times
//
//    rule.minute = minute ;
//    rule.hour = hour ;
//    var fail_query = AV.Query(Fail);
//    //todo determine the 2 options: failing from leancloud once would throw the ids? or throw the ids according to the lastUpdatedAt?
//    fail_query.equalTo("isSuccess","0");
//    var j = schedule.scheduleJob(rule,m_task.start(id));
//}
