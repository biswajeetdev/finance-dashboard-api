exports.up = function(knex) {
  return knex.schema.createTable('categories', function(t) {
    t.increments('id').primary();
    t.string('name', 100).notNullable().unique();
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categories');
};