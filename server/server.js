var loopback = require('loopback');
var boot = require('loopback-boot');


var app = module.exports = loopback();


app.use('/client', loopback.static(__dirname + '/../client'))


app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

//app.use('/test1', function(req, res, next){
//  console.log(req.params);
//  console.log('test form "catch-all" route');
//  next();
//});

app.post('/test1', function(req, res, next){
  console.log(req.json);
  res.send("hello from `test1` route")
});

app.post('/test2', function(req, res, next){
  console.log(req.params);
  res.send(req);
});
