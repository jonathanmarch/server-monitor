var _ = require('lodash');
var bookshelf = require('bookshelf');
var Checkit = require('checkit');
var moment = require('moment');

var monitor = require('./monitor');
var serverModel = require('./models/server');
var responseModel = require('./models/response');
var logModel = require('./models/log');

var exports = module.exports = {};

exports.init = function(io) {
  var _this = this;

  io.on('connection', function (socket) {

    // events
    socket.on('servers', function (data, callback) {
      _this.servers(data, callback);
    });

    socket.on('server', function (data, callback) {
      _this.server(data, callback);
    });

    socket.on('addServer', function (data, callback) {
      _this.addServer(data, callback);
    });

    socket.on('removeServers', function (data, callback) {
      _this.removeServers(data, callback);
    });

    socket.on('gamesList', function (data, callback) {
      callback(monitor.gamesList);
    });

  });

};

exports.servers = function(data, callback) {

  serverModel
  .fetchAll({withRelated: ['responses']})
  .then(function(servers) {

    var data = servers.toJSON()
    .map(function(server) {
      server.responses = _.takeRight(server.responses, 60);

      return server;
    });

    callback(data);

  });

};

exports.server = function(data, callback) {

  var serverId = Math.floor(data.id);
  var serverInfo = null;

  var show = moment().subtract(1, 'hours').valueOf(); // default 1 hour

  switch(data.show) {

    case '3hrs':
      show = moment().subtract(3, 'hours').valueOf();
    break;

    case '12hrs':
      show = moment().subtract(12, 'hours').valueOf();
    break;

    case '1day':
      show = moment().subtract(1, 'days').valueOf();
    break;

    case '7days':
      show = moment().subtract(7, 'days').valueOf();
    break;

    case 'all':
      show = 0;
    break;

  };

  serverModel.forge({id: serverId})
  .fetch({ require: true })
  .then(function(server) {

    serverInfo = server.toJSON();

    if (data.show == '7days' || data.show == 'all') {

      console.error('test');

      return responseModel
     .query(Bookshelf.knex.raw('SELECT created_at, avg(latency), avg(players) FROM responses where server_id = "6" group by strftime("%Y-%m-%d", created_at / 1000, "unixepoch")'))
     .fetchAll();

      /*return responseModel
     .query(function(qb) {
       console.log(qb.knex.raw);
       qb.where('created_at', '>', show)
       .andWhere('server_id', '=', serverId)
       .select('created_at')
       .avg('latency as latency')
       .avg('players as players')
       .groupBy(Bookshelf.knex.raw('strftime("%Y-%m-%d", created_at / 1000, "unixepoch")'));
     })
     .fetchAll();*/

    } else {

        return responseModel
       .query(function(qb) {
         qb.where('created_at', '>', show).andWhere('server_id', '=', serverId);
       })
       .fetchAll();

    }

  })
  .then(function(responses) {

    console.log(responses.toJSON());

    if (serverInfo.service == SERVICE_GAMESERVER) {
      serverInfo.gameName = _.find(Monitor.gamesList, {type: serverInfo.type}).name;
    }

    serverInfo.responses = responses.toJSON();

    return logModel
    .query(function(qb) {
      qb.where('created_at', '>', show).andWhere('server_id', '=', serverId);
    })
    .fetchAll();

    callback(serverInfo);

  })
  .then(function(logs) {

    serverInfo.logs = logs.toJSON();

    callback(serverInfo);

  })
  .catch(serverModel.NotFoundError, function(err) {

    callback({
      success: false,
      error: 'Server not found'
    });

  })
  .catch(function(err) {

    callback({
      success: false,
      error: 'Something went wrong'
    });

  });

};



exports.addServer = function(data, callback) {

  serverModel.forge(data)
  .save()
  .then(function(validated) {

    monitor.refresh()
    .then(function() {

      callback({
        success: true
      });

    });

  })
  .catch(Checkit.Error, function(err) {

    var errors = err.map(function(val, key) {
      return val;
    });

    callback({
      success: false,
      error: _.head(errors).message
    });

  })
  .catch(function(err) {

    callback({
      success: false,
      error: 'Something went wrong creating server.'
    });

  });

};

exports.removeServers = function(data, callback) {

  try {

    if (_.isEmpty(data)) {
      throw new Error('Missing servers to remove.');
    }

    if (!_.isArray(data)) {
      throw new Error('Invalid format');
    }

  }
  catch (err) {

    callback({
      success: false,
      error: err.message
    });

  }

  // quick sanitization
  data = data.map(function(id) {
    return Math.floor(id);
  });

  new serverModel()
  .where('id', 'IN', data)
  .fetchAll({ require: true })
  .then(function(servers) {

    Promise.all(servers.invoke('destroy'))
    .then(function() {
      return Monitor.refresh();
    })
    .then(function() {

      callback({
        success: true
      });

    });

  })
  .error(function(err) {

    callback({
      success: false,
      error: 'Something went wrong.'
    });

  });

};
