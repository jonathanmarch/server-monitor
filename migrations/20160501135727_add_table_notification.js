
exports.up = function(knex, Promise) {

  return knex.schema
  .createTable('notification', function (table) {
    table.string('email');
    table.boolean('error_notification');
  });

};

exports.down = function(knex, Promise) {
  knex.schema.dropTable('notification');
};
