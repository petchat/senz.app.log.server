var async = require('async');
var path = require('path');
var app = require(path.resolve(__dirname, '../server'));

var dataSource = app.dataSources['qingcloud1-mongodb'];
dataSource.automigrate('senz_app', function (err) {
    if (err) throw err;
    console.log('migrate');
    dataSource.disconnect();
});
