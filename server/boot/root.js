module.exports = function(server) {
    var router = server.loopback.Router();

    router.get('/', function (req, res) {
        res.render('index', { title: 'Hey', message: 'Hello there!'});
    });

    router.use('/login', function(req, res){
        if(req.method == 'GET') res.render('login');

        if(req.method == 'POST'){
            server.models.User.login(req.body).then(
                function(d){
                    res.send(d);
                },
                function(e){
                    res.send(e);
                }
            );
        }
    });

    router.get('/test', function(req, res){
        res.render('index', { title: 'Hey', message: 'Hello there!'});
    });


    server.use(router);
};
