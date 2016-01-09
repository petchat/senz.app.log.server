var uuid = require("uuid");
var path = require("path");
var mkdirp = require('mkdirp');
var StorageService = require("loopback-component-storage").StorageService;

module.exports = function(server) {
    var router = server.loopback.Router();

    router.use('/createApp', function (req, res) {
        if(req.method == 'GET') res.render('index.html');
        if(req.method == 'POST') {
            server.models.senz_app.create({
                app_name: req.body.app_name,
                app_key: uuid.v4(),
                type: "test",
                user_id: req.body.developer_id
            }, function(err, model){
                if(err){
                    res.send(err);
                }else{
                    res.send({appId: model.id});
                }
            });
        }
    });

    var handler = new StorageService({provider: 'filesystem', root: path.join(__dirname, '../../storage')});


    router.get('/uploadCert', function(req, res){
        res.setHeader('Content-Type', 'text/html');
        var form = "<html><body>" +
            "<form method='POST' enctype='multipart/form-data' action='/uploadCert/con1'>"
            + "Cert: <input type=file name=cert multiple=true><br>"
            + "Key: <input type=file name=key multiple=true><br>"
            + "APPID: <input type=text name=appId><br>"
            + "<input type=submit value=Upload></form>" +
            "</body></html>";
        res.send(form);
        res.end();
    });

    router.post('/uploadCert/:container', function(req, res) {
        console.log(req.appId);
        handler.upload(req, res, function(err, result) {
            if (!err) {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(result);
            } else {
                res.status(500).send(err);
            }
        });
    });

    server.use(router);
};
