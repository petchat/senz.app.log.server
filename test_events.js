///**
// * Created by zhanghengyang on 15/7/5.
// */
//
//
//var a = function(cb){
//  console.log(1)
//  cb(3)
//}
//
//var d = function(cb){
//  console.log(1)
//  cb(4)
//}
//
//var e = function(n){
//  process.nextTick(function(){
//    console.log(5)
//
//  })
//}
//
//var c = function(n){
//  process.nextTick(function(){
//    console.log(n)
//
//  })
//}
//
//a(c)
//d(e)
//a(c)
//process.nextTick(function(){
//  console.log(2)
//})


var MongoClient = require('mongodb').MongoClient

 // , assert = require('assert');

var url = 'mongodb://senz:xiaosenz@119.254.111.40:27017/senz';

MongoClient.connect(url, function(err, db) {

  console.log(err)
  console.log("Connected correctly to server");

  db.close();

});

