var uuid = require("uuid");

module.exports = function(server) {
    var router = server.loopback.Router();

    router.use('/', function (req, res) {
        if(req.method == 'GET') res.render('index.html');
        if(req.method == 'POST') {
            server.models.senz_app.create({
                app_name: req.body.app_name,
                app_key: uuid.v4(),
                type: "",
                user_id: req.body.developer_id
            }, function(err, model){
                if(err) console.log(err);
                res.send(model);
            });
        }
    });
    server.use(router);
};
