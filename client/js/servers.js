angular.module('app')
.controller('ServerListController', function($scope, $location, socket) {

  $scope.services = ['ping', 'http'];

  $scope.view = function(server) {
    $location.path('/server/' + server.id);
  };

  socket.emit('servers', null, function (data) {

    $scope.$apply(function () {

      data = data.map(function(server) {

        var latencySum = _.sumBy(server.responses, 'latency');
        var aliveSum = _.sumBy(_.filter(server.responses, { alive: 1}), 'alive');
        var status = _.sumBy(_.takeRight(server.responses, 3), 'alive');
        var checks = _.takeRight(server.responses, 3).length;

        server.average_latency = latencySum / server.responses.length;
        server.status = (checks == status) ? 'Online' : 'Offline';
        server.uptime = (aliveSum / server.responses.length) * 100;

        return server;

      });

      $scope.servers = data;

     });

  });

});


angular.module('app')
.controller('AddServerController', function($scope, $location, socket) {

  $('select').material_select();

  socket.emit('gamesList', null, function (data) {

    $scope.$apply(function () {
      $scope.games = data;
    });

  });

  $scope.addServer =  function() {

    socket.emit('addServer', $scope.server, function (data) {

      if (data.success === true) {

        $scope.$apply(function() {
          $location.path('#/');
        });

        Materialize.toast('Server created successfully.', 4000);
      } else {
        Materialize.toast('Error: ' + data.error, 4000);
      }

    });

  };

});

angular.module('app')
.controller('RemoveServerController', function($scope, socket) {

  $scope.services = ['ping', 'http'];
  $scope.checkedServers = [];


  $scope.toggleCheck = function (id) {

     if ($scope.checkedServers.indexOf(id) === -1) {
         $scope.checkedServers.push(id);
     } else {
         $scope.checkedServers.splice($scope.checkedServers.indexOf(id), 1);
     }

 };

  $scope.removeSelected = function() {

    socket.emit('removeServers', $scope.checkedServers, function (data) {

      if (data.success === true) {
        Materialize.toast('Servers removed successfully', 4000);
        $scope.refresh();
        $scope.checkedServers = [];
      } else {
        Materialize.toast('Error: ' + data.error, 4000);
      }
    });

  };

  $scope.refresh = function() {

    socket.emit('servers', null, function (data) {

      $scope.$apply(function () {

        data = data.map(function(server) {

          var latencySum = _.sumBy(server.responses, 'latency');
          var aliveSum = _.sumBy(_.filter(server.responses, { alive: 1}), 'alive');
          var status = _.sumBy(_.takeRight(server.responses, 3), 'alive');
          var checks = _.takeRight(server.responses, 3).length;

          server.average_latency = latencySum / server.responses.length;
          server.status = (checks == status) ? 'Online' : 'Offline';
          server.uptime = (aliveSum / server.responses.length) * 100;

          return server;

        });

        $scope.servers = data;

       });

    });

  };

  $scope.refresh();

});


angular.module('app')
.controller('ServerStatsController', function($scope, $routeParams, socket) {

  $('ul.tabs').tabs();

  $scope.services = ['ping', 'http'];

  Highcharts.setOptions({
  	global: {
  		useUTC: false
  	}
  });

  var options = {
    chart: {
        type: 'spline',
        renderTo: 'graph'
    },
    title: {
        text: ''
    },
    subtitle: {
        text: ''
    },
    xAxis: {
        type: 'datetime',
        labels: {
          format: '{value:%H:%M}'
          //format: '{value:%b-%d %H:%M}'
        },
        //minTickInterval: 10 * 60000,
    },
    yAxis: {
        title: {
            text: 'Latency (ms)'
        }
    },

    plotOptions: {
        spline: {
            marker: {
                enabled: true
            }
        }
    },
    tooltip: {
        xDateFormat: '%Y-%m-%d %H:%M'
    },
    series: []

  };

  var chart = null;

  $scope.update = function(show) {

    socket.emit('server', { id: $routeParams.server_id, show: show }, function (server) {

      console.log(show);

      if (show == '1days' || show == '7days' || show == 'all') {
        options.xAxis.labels.format = '{value:%b-%d %H:%M}';
      } else {
        options.xAxis.labels.format = '{value: %H:%M}';
      }

      $scope.logs = server.logs;

      if (chart) {
        options.series = [];
      }

      options.title.text = (server.name) ? server.name : server.host;
      options.subtitle.text = (server.service == 2) ? server.gameName : '';

      var latency = server.responses.map(function(response) {
        return [new Date(response.created_at).setSeconds(0), response.latency];
      });

      console.log(server.responses);

      options.series.push({
        name: "Latency (ms)",
        color: "#66BB6A",
        data: latency
      });

      if (server.service == 2) {

        var players = server.responses.map(function(response) {
          return [new Date(response.created_at).setSeconds(0), response.players];
        });

        options.series.push({
          name: "Players",
          data: players
        });

      }

      chart = new Highcharts.Chart(options);

      $scope.$apply(function () {

        var latencySum = _.sumBy(server.responses, 'latency');
        var aliveSum = _.sumBy(_.filter(server.responses, { alive: 1}), 'alive');
        var downtime = _.filter(server.responses, { alive: 0 });
        var status = _.sumBy(_.takeRight(server.responses, 3), 'alive');
        var checks = _.takeRight(server.responses, 3).length;

        server.status = (checks == status) ? 'Online' : 'Offline';
        server.average_latency = latencySum / server.responses.length;
        server.downtime = downtime;
        server.uptime = (aliveSum / server.responses.length) * 100;

        $scope.server = server;
      });

    });

  };


  socket.on('serverUpdate', function(data) {

    if (data.server_id == $routeParams.server_id) {

      var shift = chart.series[0].length > 60;

      chart.series[0].addPoint([new Date(data.created_at).setSeconds(0), data.latency], true, shift);

      if ($scope.server.service == 2) {
        chart.series[1].addPoint([new Date(data.created_at).setSeconds(0), data.players], true, shift);
      }
    }

  });

  $scope.update('1hr');

});
