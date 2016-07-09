
exports.up = function(knex, Promise) {

  return knex.schema
  .createTable('logs', function (table) {
    table.increments();
    table.integer('server_id').references('server.id');
    table.string('log');
    table.timestamps();
  });

};

exports.down = function(knex, Promise) {
  knex.schema.dropTable('responses');
};
