var bookshelf = require('../helpers/bookshelf');

module.exports = bookshelf.Model.extend({
  tableName: 'responses',
  hasTimestamps: true
});
