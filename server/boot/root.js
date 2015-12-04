module.exports = function(server) {
    var router = server.loopback.Router();
    //router.get('/', server.loopback.status());

    router.get('/', function (req, res) {
        res.render('index', { title: 'Hey', message: 'Hello there!'});
    });

    router.post('/test', function(req, res){
        console.log(req.body);
        res.send({msg: "OK!"});
    });

    server.use(router);
};
