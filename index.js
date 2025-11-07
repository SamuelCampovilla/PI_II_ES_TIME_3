
// codigo para fazer a conexão com o banco de dados - Caio Polo

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env explicitly from repository root
dotenv.config({ path: path.resolve(__dirname, '.env') });

const host = process.env.DB_HOST || 'caboose.proxy.rlwy.net';
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 31256;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || 'UerGWimRCmPCiXyKgdbodDRyfrXaedsf';
const database = process.env.DB_NAME || 'railway';

export async function connectToDatabase() {
    try {
        const connection = await mysql.createConnection({ host, port, user, password, database });
        console.log('conexão bem sucedida');
        await connection.end();
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        throw error;
    }
}


if (process.env.NODE_ENV !== 'test') {
    connectToDatabase().catch(() => {});
}

export const dbConfig = { host, port, user, password, database };