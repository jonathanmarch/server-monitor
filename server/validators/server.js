var _ = require('lodash');

var Checkit = require('checkit');
var validator = require('validator');

var monitor = null;

Checkit.Validator.prototype.host = function(val) {
  if (validator.isFQDN(val) || validator.isIP(val)) { return true; }
  else { throw new Error('Invalid host or ip.'); }
};

Checkit.Validator.prototype.game = function(val) {
  
  // load games list once
  if (monitor == null) {
    monitor = require('../monitor');
  }

  if (_.find(monitor.gamesList, { 'type': val })) { return true; }
  else { throw new Error('Invalid game server type.'); }
};


var validationRules = new Checkit({
  service: ['required', 'integer', 'between:-1:3'],
});

// validate host
validationRules.maybe({ host: ['required', 'host'] }, function(input) {
  return (input.service == SERVICE_PING || input.service == SERVICE_GAMESERVER);
});

// validate url
validationRules.maybe({ host: ['required', 'url'] }, function(input) {
  return (input.service == SERVICE_URL);
});

// game server and port if game server
validationRules.maybe({ port: ['required', 'integer', 'between:0:65536'], type: ['required', 'game'] }, function(input) {
  return (input.service == SERVICE_GAMESERVER);
});

module.exports = validationRules;
