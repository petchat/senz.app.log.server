var uuid = require("uuid");
var path = require("path");
var fs = require('fs');
var StorageService = require("loopback-component-storage").StorageService;
var handler = new StorageService({provider: 'filesystem', root: path.join(__dirname, '../../storage')});

module.exports = function(server) {
    var router = server.loopback.Router();
    router.get('/', server.loopback.status());

    router.use('/signup', function(req, res){
        if(req.method == 'GET') res.render('signup.html');

        if(req.method == 'POST') {
            var email = req.body.email;
            var password1 = req.body.password1;
            var password2 = req.body.password2;
            if(!password1 || !password2 || (password1 != password2)){
                return res.status(400).send("Twice Password are not equal!");
            }
            server.models.Developer.create({email: email, password: password1}, function(err, user){
                if(err){
                    return res.status(400).send("Create Developer Failed!")
                }
                return res.send(user);
            });
        }
    });

    router.use('/createApp', function (req, res) {
        if(req.method == 'GET') res.render('create_app.html');
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

    router.get('/uploadCert', function(req, res) {
        res.setHeader('Content-Type', 'text/html');
        var form =
            "<form method='POST' enctype='multipart/form-data' action='/uploadCert/con1'>"
            + "Cert: <input type=file name=cert multiple=false><br>"
            + "Key: <input type=file name=key multiple=false><br>"
            + "PASS: <input type=password name=pass ><br>"
            + "AppId: <input type=text name=appId><br>"
            + "<input type=submit value=Upload></form>" +
            "</body></html>";
        res.send(form);
        res.end();
    });

    router.post('/uploadCert/:container', function(req, res) {
        handler.upload(req, res, function(err, result) {
            if (err) return res.status(500).send(err);

            handler.getFile(req.params.container, result.files.cert[0].name, function(e, d){
                var certpath = path.join(d.client.root, result.files.cert[0].container, result.files.cert[0].name);
                var keypath = path.join(d.client.root, result.files.key[0].container, result.files.key[0].name);
                fs.readFile(certpath, function(e, cert){
                    fs.readFile(keypath, function(e, key){
                        server.models.senz_app.findOne({where: {id: result.fields.appId[0]}}, function(err, model){
                            model.cert = cert;
                            model.key = key;
                            model.cert_pass = result.fields.pass[0];
                            model.save(function(e, d){
                                if(e){
                                    return res.send({msg: "upload failed!"});
                                }
                                return res.send({msg: "upload success!"});
                            })
                        })
                    });
                })
            });
        });
    });

    server.use(router);
};
