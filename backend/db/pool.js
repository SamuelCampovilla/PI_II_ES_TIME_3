import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || 'caboose.proxy.rlwy.net',
  port: parseInt(process.env.DB_PORT || '31256', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'UerGWimRCmPCiXyKgdbodDRyfrXaedsf',
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10
};

console.log('Database config:', {
  host: config.host,
  port: config.port,
  user: config.user,
  database: config.database,
  hasPassword: !!config.password
});

export const pool = mysql.createPool(config);

