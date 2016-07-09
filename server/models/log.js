var bookshelf = require('../helpers/bookshelf');

module.exports = bookshelf.Model.extend({
  tableName: 'logs',
  hasTimestamps: true
});
