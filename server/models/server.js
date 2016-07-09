var _ = require('lodash');

var bookshelf = require('../helpers/bookshelf');
var responseModel = require('../models/response');
var logModel = require('../models/log');

var serverValidation = require('../validators/server');

module.exports = bookshelf.Model.extend({
  tableName: 'servers',
  hasTimestamps: true,

  initialize: function() {
    this.on('creating', this.validateCreate);
  },

  validateCreate: function(model, attrs, options) {

    this.attributes = _.pick(this.attributes, ['service', 'host', 'port', 'type']);

    return serverValidation.run(this.attributes);

  },

  responses: function() {
    return this.hasMany(responseModel);
  },

  logs: function() {
    return this.hasMany(logModel);
  }
});
