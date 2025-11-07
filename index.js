
// codigo para fazer a conexão com o banco de dados - Caio Polo

import 'dotenv/config';
import mysql from 'mysql2/promise';

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