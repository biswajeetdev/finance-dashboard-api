const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  await knex('financial_records').del();
  await knex('users').del();
  await knex('categories').del();

  await knex('categories').insert([
    { name: 'Salary' },
    { name: 'Rent' },
    { name: 'Food' },
    { name: 'Transport' },
    { name: 'Utilities' },
    { name: 'Investments' }
  ]);

  const hash = (pw) => bcrypt.hashSync(pw, 12);

  const [admin] = await knex('users').insert({
    name: 'Admin User',
    email: 'admin@finance.com',
    password_hash: hash('Admin@123'),
    role: 'admin'
  }).returning('*');

  const [analyst] = await knex('users').insert({
    name: 'Analyst User',
    email: 'analyst@finance.com',
    password_hash: hash('Analyst@123'),
    role: 'analyst'
  }).returning('*');

  await knex('users').insert({
    name: 'Viewer User',
    email: 'viewer@finance.com',
    password_hash: hash('Viewer@123'),
    role: 'viewer'
  });

  const categories = await knex('categories').select('*');
  const cat = Object.fromEntries(categories.map(c => [c.name, c.id]));

  const records = [];
  const months = ['2025-01', '2025-02', '2025-03', '2025-04'];

  for (const month of months) {
    records.push(
      { amount: 75000, type: 'income',  category_id: cat['Salary'],      date: `${month}-01`, notes: 'Monthly salary',   created_by: admin.id },
      { amount: 15000, type: 'expense', category_id: cat['Rent'],        date: `${month}-02`, notes: 'Monthly rent',      created_by: admin.id },
      { amount: 5000,  type: 'expense', category_id: cat['Food'],        date: `${month}-10`, notes: 'Groceries',         created_by: analyst.id },
      { amount: 2000,  type: 'expense', category_id: cat['Transport'],   date: `${month}-15`, notes: 'Fuel',              created_by: analyst.id },
      { amount: 10000, type: 'income',  category_id: cat['Investments'], date: `${month}-20`, notes: 'Dividend received', created_by: admin.id }
    );
  }

  await knex('financial_records').insert(records);
  console.log('✅ Seed complete!');
};