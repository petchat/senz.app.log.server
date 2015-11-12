module.exports = function mountRestApi(server) {

  console.log(JSON.stringify(server));

  var restApiRoot = server.get('restApiRoot');
  server.use(restApiRoot, server.loopback.rest());
};
