var loopback = require('loopback');
var boot = require('loopback-boot');
var bodyParser = require('body-parser');
var path = require("path");
var mkdirp = require('mkdirp');
var StorageService = require("loopback-component-storage").StorageService;

var app = module.exports = loopback();

app.set('views', __dirname + '/../dashboard/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use('/client', loopback.static(__dirname + '/../client'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


//var handler = new StorageService({provider: 'filesystem', root: path.join(__dirname, '../storage')});

//
//app.get('/uploadCert', function(req, res, next){
//    res.setHeader('Content-Type', 'text/html');
//    var form = "<html><body>" +
//        "<form method='POST' enctype='multipart/form-data' action='/uploadCert/con1'>"
//        + "Cert: <input type=file name=cert multiple=true><br>"
//        + "Key: <input type=file name=key multiple=true><br>"
//        + "APPID: <input type=text name=appId><br>"
//        + "<input type=submit value=Upload></form>" +
//        "</body></html>";
//    res.send(form);
//    res.end();
//});
//
//app.post('/uploadCert/:container', function(req, res, next) {
//    console.log(req.body.appId);
//    handler.upload(req, res, function(err, result) {
//        if (!err) {
//            res.setHeader('Content-Type', 'application/json');
//            res.status(200).send(result);
//        } else {
//            res.status(500).send(err);
//        }
//    });
//});


app.start = function() {
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};


boot(app, __dirname, function(err) {
  if (err) throw err;

  if (require.main === module)
    app.start();
});

