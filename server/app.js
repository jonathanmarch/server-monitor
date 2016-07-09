var express = require('express');
var path = require('path');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var monitor = require('./monitor');
var websocket = require('./websocket');

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(3000, function() {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Server Monitor app listening at http://%s:%s', host, port);

  websocket.init(io);
  monitor.io = io;

  monitor.start(function() {
    console.log('Server Monitor loop has started.');
  });

});

module.exports = server;
