var loopback = require('loopback');
var boot = require('loopback-boot');
var bodyParser = require('body-parser');

var app = module.exports = loopback();

app.set('views', __dirname + '/../dashboard/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use('/client', loopback.static(__dirname + '/../client'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies



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

