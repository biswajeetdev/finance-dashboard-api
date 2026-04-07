exports.up = function(knex) {
  return knex.schema.createTable('financial_records', function(t) {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.decimal('amount', 12, 2).notNullable();
    t.enu('type', ['income', 'expense']).notNullable();
    t.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.date('date').notNullable();
    t.text('notes').nullable();
    t.boolean('is_deleted').defaultTo(false);
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('financial_records');
};