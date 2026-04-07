exports.up = function(knex) {
  return knex.schema.createTable('users', function(t) {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 100).notNullable();
    t.string('email', 255).unique().notNullable();
    t.string('password_hash').notNullable();
    t.enu('role', ['viewer', 'analyst', 'admin']).notNullable().defaultTo('viewer');
    t.enu('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};