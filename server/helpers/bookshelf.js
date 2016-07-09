var knexFile = require('../../knexfile');
var knex = require('knex')(knexFile[process.env.NODE_ENV || 'development']);
var bookshelf = require('bookshelf')(knex);

module.exports =  bookshelf;
