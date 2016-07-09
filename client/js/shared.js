angular.module('shared', []);

angular.module('shared')
.factory('socket', function() {

  var socket = io();

  return socket;

});
