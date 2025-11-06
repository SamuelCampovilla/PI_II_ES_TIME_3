import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { dbConfig } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/src')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/src/index.html'));
});

app.get('/frontend/pages/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/signup.html'));
});

// Rota para cadastro de usuário
app.post('/cadastro', async (req, res) => {
    const { name, email, password, telefone } = req.body;
    let connection;

    if (!name || !email || !password || !telefone) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        connection = await mysql.createConnection(dbConfig);

        const query = 'INSERT INTO docente (nome, email, senha, telefone) VALUES (?,?,?,?)';
        const [result] = await connection.execute(query, [name, email, password, telefone]);

        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            id: result.insertId
        });

    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email já cadastrado' });
        }
        return res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.listen(port, () => {
    console.log(`Servidor aberto em http://localhost:${port}`);
});
