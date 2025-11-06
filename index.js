import mysql from 'mysql2/promise';

const host = 'caboose.proxy.rlwy.net';
const port = 31256;
const user = 'root';  
const password = 'UerGWimRCmPCiXyKgdbodDRyfrXaedsf';   
const database = 'railway'; 

export async function connectToDatabase() {
    try {
        const connection = await mysql.createConnection({
            host,
            port,
            user,
            password,
            database
        });
        console.log('conexão estabelecida com sucesso.');
        return connection; 
    }   
    catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        throw error;
    }
}
