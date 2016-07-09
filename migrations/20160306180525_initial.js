
exports.up = function(knex, Promise) {

  return knex.schema
  .createTable('servers', function (table) {
    table.increments();
    table.integer('service');
    table.string('host');
    table.integer('port');
    table.string('name');
    table.string('type');
    table.timestamps();
  });

};

exports.down = function(knex, Promise) {
  knex.schema.dropTable('servers');
};
