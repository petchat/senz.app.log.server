var loopback = require('loopback');
var boot = require('loopback-boot');
var bodyParser = require('body-parser');


var app = module.exports = loopback();

app.set('views', __dirname + '/../dashboard/views');
app.set('view engine', 'jade');
app.use(loopback.static(__dirname + '/dashboard/static'));
app.use('/client', loopback.static(__dirname + '/../client'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


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

