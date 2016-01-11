var loopback = require('loopback');
var multer = require('multer');
var fs = require("fs");
var path = require("path");
var mkdirp = require('mkdirp');
var StorageService = require("loopback-component-storage").StorageService;

module.exports = function(app) {
    //var handler = new StorageService({provider: 'filesystem', root: path.join(__dirname, '../../storage')});
    //app.get('/', function(req, res) {
    //    res.setHeader('Content-Type', 'text/html');
    //    var form =
    //        "<form method='POST' enctype='multipart/form-data' action='/upload/con1'>"
    //        + "File to upload: <input type=file name=uploadedFiles multiple=true><br>"
    //        + "Notes about the file: <input type=text name=note><br>"
    //        + "<input type=submit value=Upload></form>" +
    //        "</body></html>";
    //    res.send(form);
    //    res.end();
    //});
    //
    //app.post('/upload/:container', function(req, res) {
    //    handler.upload(req, res, function(err, result) {
    //        if (!err) {
    //            res.setHeader('Content-Type', 'application/json');
    //            res.status(200).send(result);
    //        } else {
    //            res.status(500).send(err);
    //        }
    //    });
    //});
};
