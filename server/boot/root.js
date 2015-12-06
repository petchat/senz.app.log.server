module.exports = function(server) {
    var router = server.loopback.Router();
    //router.get('/', server.loopback.status());

    router.get('/', function (req, res) {
        res.render('index', { title: 'Hey', message: 'Hello there!'});
    });

    router.get('/test', function(req, res){
        res.render('login', { title: 'Hey', message: 'Hello there!'});
    });

    server.use(router);
};
