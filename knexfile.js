require('dotenv').config();

const base = {
  client: 'postgresql',
  connection: {
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  migrations: { directory: './src/db/migrations' },
  seeds:      { directory: './src/db/seeds' }
};

module.exports = {
  development: {
    ...base,
    debug: false
  },
  test: {
    ...base,
    connection: { ...base.connection, database: process.env.DB_NAME_TEST || `${process.env.DB_NAME}_test` }
  },
  production: {
    ...base,
    pool: { min: 2, max: 10 },
    connection: {
      ...base.connection,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
  }
};