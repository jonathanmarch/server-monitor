angular.module('app', ['ngRoute', 'shared', 'templates']);

window.SERVICE_PING = 0;
window.SERVICE_URL = 1;
window.SERVICE_GAMESERVER = 2;

angular.module('app')
.config(function($routeProvider, $locationProvider) {

  $routeProvider.when('/', {
    templateUrl: 'servers.html',
    controller: 'ServerListController'
  })
  .when('/add', {
    templateUrl: 'add.html',
    controller: 'AddServerController'
  })
  .when('/remove', {
    templateUrl: 'remove.html',
    controller: 'RemoveServerController'
  })
  .when('/server/:server_id', {
    templateUrl: 'stats.html',
    controller: 'ServerStatsController'
  })
  .when('/notifications', {
    templateUrl: 'notifications.html',
  })
  .otherwise({redirectTo: '/'});

});
