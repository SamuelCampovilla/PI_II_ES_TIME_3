//código do servidor - Caio Polo - Samuel Campovilla - Vinicius castro - Caua Bianchi

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

app.get('/frontend/pages/forgotpassword.html', (req, res) =>{
    res.sendFile(path.join(__dirname, '../frontend/pages/forgotpassword.html'));
})

app.get('/frontend/pages/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/signup.html'));
});


app.get('/frontend/pages/instituicao.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/instituicao.html'));
});

// Rota para cadastro de usuário - Caio 
app.post('/cadastro', async (req, res) => {
    const { name, email, password, telefone } = req.body;
    let connection;

    if (!name || !email || !password || !telefone) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        connection = await mysql.createConnection(dbConfig);

        const query = 'INSERT INTO docentes (nome, email, senha, telefone) VALUES (?,?,?,?)';
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



app.post('/login', async(req, res) =>{
    const {email, password} = req.body;
    let connection;
    if(!email || !password){
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    try{
        connection = await mysql.createConnection(dbConfig);
        const query = 'SELECT email, senha FROM docentes WHERE email = ? and senha = ?';
        const [result] = await connection.execute(query, [email, password]);

        if (result && result.length === 1){
            return res.status(200).json({ message: 'Login correto!' });
        } else {
            return res.status(401).json({ message: 'Email ou senha inválidos!' });
        }
    }catch(error){
        console.error('Erro ao entrar.');
        return res.status(500).json({ message: 'Erro interno do servidor' });

    }finally{
        if(connection){
            await connection.end();
        }
    }
});



app.listen(port, () => {
    console.log(`Servidor aberto em http://localhost:${port}`);
});
