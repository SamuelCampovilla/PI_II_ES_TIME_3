//código do servidor - Caio Polo - Samuel Campovilla - Vinicius castro - Caua Bianchi

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { dbConfig } from '../index.js';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: 'projetonotadezgrupo3@gmail.com',
         pass: 'egleaakcifizvpgu'
    },
    tls:{
        rejectUnauthorized: false
    }
});



app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/src')));

//---------------------------------------------------------------------------------------------------//

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/src/index.html'));
});

app.get('/frontend/pages/forgotpassword.html', (req, res) =>{
    res.sendFile(path.join(__dirname, '../frontend/pages/forgotpassword.html'));
})

app.get('/frontend/pages/redefine_pass.html', (req, res) =>{
    res.sendFile(path.join(__dirname, '../frontend/pages/redefine_pass.html'));
})

app.get('/frontend/pages/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/signup.html'));
});


app.get('/frontend/pages/instituicao.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/instituicao.html'));
});




//---------------------------------------------------------------------------------------------------//
// Rota para cadastro de usuário - Caio Polo
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
//---------------------------------------------------------------------------------------------------//

//rota para login - caio Polo
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

//---------------------------------------------------------------------------------------------------//

// enviar email de recuperaçao de senha Vinicius Castro e Caio Polo

app.post('/forgot', async(req, res) =>{
    const {email} = req.body;
    let connection;

    if(!email){
        return res.status(400).json({ message: 'O campo de email é obrigatório' });
    }
    try{
        connection = await mysql.createConnection(dbConfig);
        const query = 'SELECT email FROM docentes WHERE email = ?';
        const [result] = await connection.execute(query, [email]);

        if(result && result.length === 1){
            const mail = {
                from: 'projetonotadezgrupo3@gmail.com',
                to: email,
                subject: 'Recuperação de senha NotaDez.',
                html: `<h3>Olá!</h3>
                        <p>Você solicitou a recuperação de senha do NotaDez.</p>
                        <p>Clique neste link para redefinir sua senha: 
                        <a href="http://localhost:3000/frontend/pages/redefine_pass.html">Redefinir Senha</a></p>
                        `    
            };

            try{
                await new Promise((resolve, reject) => {
                    transporter.sendMail(mail, (error, info) => {
                        if (error) {
                            console.error('Erro ao enviar email:', error);
                            reject(error);
                        } else {
                            console.log('Email enviado:', info.response);
                            resolve(info);
                        }
                    });
                });
                
                return res.status(200).json({ 
                    message: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' 
                });
            }catch(errorMail){
                console.error('ERRO AO ENVIAR EMAIL:', errorMail);
                return res.status(500).json({ 
                    message: 'Erro ao enviar o email de recuperação. Por favor, tente novamente.' 
                });
            }
        }else{
            return res.status(401).json({ message: 'Email inválido! tente novamente com outro e-mail' });

        }
        
    }catch(error){
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }finally{
        if(connection){
            await connection.end();
        }
    }

});


//---------------------------------------------------------------------------------------------------//
app.listen(port, () => {
    console.log(`Servidor aberto em http://localhost:${port}`);
});
