
exports.up = function(knex, Promise) {

  return knex.schema
  .createTable('responses', function (table) {
    table.increments();
    table.integer('server_id').references('server.id');
    table.boolean('alive');
    table.boolean('players');
    table.integer('latency');
    table.timestamps();
  });

};

exports.down = function(knex, Promise) {
  knex.schema.dropTable('responses');
};
