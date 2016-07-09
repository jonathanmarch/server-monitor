var _ = require('lodash');
var fs = require('fs');
var gamedig = require('gamedig');
var ping = require('jjg-ping');
var request = require('request');

var serverModel = require('./models/server');
var responseModel = require('./models/response');
var logModel = require('./models/log');

Monitor = {};

Monitor.delay = 60000;
Monitor.servers = {};

global.SERVICE_PING = 0;
global.SERVICE_URL = 1;
global.SERVICE_GAMESERVER = 2;

Monitor.start = function(callback) {

  Monitor.gamesList = Monitor.getGamesList();

  Monitor.refresh()
  .then(function(servers) {

    Monitor.tick();
    setInterval(Monitor.tick, Monitor.delay);
    callback();

  });

};

Monitor.refresh = function() {

  var promise = new Promise(
    function(resolve, reject) {

      serverModel.fetchAll()
      .then(function(servers) {
        Monitor.servers = servers;
        resolve(servers);
      })
      .catch(function(err) {
        reject(err);
      });

    }
  );

  return promise;

};

Monitor.checkPing = function(host) {

  var promise = new Promise(
    function(resolve, reject) {

      ping.system.ping(host, function(latency, status) {
        return (status ? resolve(latency) : reject(new Error('Server is offline or not responding.')));
      });

    }
  );

  return promise;

};

Monitor.checkHTTP = function(url) {

  var promise = new Promise(
    function(resolve, reject) {

      var start = new Date();

      request(url, function(error, response, body) {

        if (!error) {

          var end = new Date() - start;

          if (response.statusCode == 200) { // HTTP OK
            resolve(end);
          } else {
            reject(new Error('Server is responding with ' + response.statusCode));
          }

        } else {
          reject(new Error('Server is offline or not responding.'));
        }

      });

    }
  );

  return promise;

};

Monitor.checkGameServer = function(type, host, port) {

  var promise = new Promise(
    function(resolve, reject) {

      var start = new Date();

      gamedig.query({
          type: type,
          host: host,
          port: port
        },
        function(state) {
          if (state.error) {
            reject(new Error('Game server is offline or not responding.'));
          } else {

            var end = new Date() - start;
            state.latency = end;

            resolve(state);
          }
        }
      );

    }
  );

  return promise;

};

// taken from gamedig
Monitor.getGamesList = function() {

  var lines = fs.readFileSync('node_modules/gamedig/games.txt', 'utf8').split('\n');
  var games = [];

  lines.forEach(function(line) {
    // strip comments
    var comment = line.indexOf('#');
    if (comment != -1) line = line.substr(0, comment);
    line = line.trim();
    if (!line) return;

    var split = line.split('|');

    games.push({ name: split[1].trim(), type: split[0].trim()});

  });

  return games;

};

Monitor.tick = function() {

  Monitor.servers
  .forEach(function(server) {

    switch(server.get('service')) {

      case 0:

        Monitor.checkPing(server.get('host'))
        .then(function(latency) {
          return responseModel.forge({ server_id: server.get('id'), alive: 1, latency: latency }).save();
        })
        .then(function(response) {
          Monitor.io.emit('serverUpdate', response.toJSON());
        })
        .catch(function(err) {
          responseModel.forge({ server_id: server.get('id'), alive: 0, latency: 0 }).save();
          logModel.forge({ server_id: server.get('id'), log: err.message }).save();
        });

      break;

      case 1:

        Monitor.checkHTTP(server.get('host'))
        .then(function(latency) {
          return responseModel.forge({ server_id: server.get('id'), alive: 1, latency: latency }).save();
        })
        .then(function(response) {
          Monitor.io.emit('serverUpdate', response.toJSON());
        })
        .catch(function(err) {
          responseModel.forge({ server_id: server.get('id'), alive: 0, latency: 0  }).save();
          logModel.forge({ server_id: server.get('id'), log: err.message }).save();
        });

      break;

      case 2:

        Monitor.checkGameServer(server.get('type'), server.get('host'), server.get('port'))
        .then(function(gameserver) {
          server.save({name: gameserver.name});
          return responseModel.forge({ server_id: server.get('id'), alive: 1, latency: gameserver.latency, players: gameserver.players.length }).save();
        })
        .then(function(response) {
          Monitor.io.emit('serverUpdate', response.toJSON());
        })
        .catch(function(err) {
          responseModel.forge({ server_id: server.get('id'), alive: 0, latency: 0, players: 0 }).save();
          logModel.forge({ server_id: server.get('id'), log: err.message }).save();
        });

      break;

    }
  });
};

module.exports = Monitor;
