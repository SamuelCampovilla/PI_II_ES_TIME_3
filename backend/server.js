//código do servidor - Caio Polo - Samuel Campovilla - Vinicius castro - Caua Bianchi

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { dbConfig } from '../index.js';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env explicitly from project root (one level above backend)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/src')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/src/index.html'));
});

app.get('/frontend/pages/forgotpassword.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/forgotpassword.html'));
});

app.get('/frontend/pages/redefine_pass.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/redefine_pass.html'));
});

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

app.post('/forgotpassword', async (req, res) => {
    const { email } = req.body || {};
    let connection;

    console.log('POST /forgotpassword body:', req.body);

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email inválido' });
    }

    // DEBUG: se a variável FORCE_FORGOT estiver ativa, forçamos sucesso
    if (process.env.FORCE_FORGOT === 'true') {
        console.log('FORCE_FORGOT=true — retornando sucesso sem DB/SMTP (modo debug)');
        return res.status(200).json({ message: 'Email de recuperação enviado (modo debug - forçado)' });
    }

    // verifica se o usuário existe no banco
    let userExists = false;
    try {
        connection = await mysql.createConnection(dbConfig);
        const query = 'SELECT email FROM docentes WHERE email = ?';
        const [result] = await connection.execute(query, [email]);
        userExists = !!(result && result.length === 1);
    } catch (dbErr) {
        console.error('Erro ao consultar DB (não fatal, prosseguindo):', dbErr && dbErr.message);
    } finally {
        if (connection) {
            try { await connection.end(); } catch (e) { /* ignore */ }
        }
    }

    if (!userExists) {
        console.log('Usuário não encontrado no DB (ou DB inacessível). Email:', email);
        return res.status(404).json({ message: 'Email não encontrado!' });
    }

    // prepara o transporter: prioriza variáveis de ambiente, senão usa conta de teste
    let transporter;
    let usingTestAccount = false;
    try {
        if (process.env.DISABLE_EMAIL === 'true') {
            console.log('DISABLE_EMAIL=true — envio de e-mail desabilitado para desenvolvimento.');
            return res.status(200).json({ message: 'Envio de email desabilitado (modo debug)' });
        }

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
                secure: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) === 465 : true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            console.log('Usando SMTP a partir de variáveis de ambiente');
        } else {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            usingTestAccount = true;
            console.log('Nenhuma credencial SMTP encontrada — usando conta de teste do nodemailer (ethereal)');
        }
    } catch (tErr) {
        console.error('Erro ao configurar transporter SMTP:', tErr);
        return res.status(500).json({ message: 'Erro interno ao configurar envio de email' });
    }

    try {
        const destino = email;
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'Grupo 3 - NotaDez <no-reply@example.com>',
            to: destino,
            subject: 'Recuperação de Senha - NotaDez',
            text: 'Clique no link para redefinir sua senha: http://localhost:3000/frontend/pages/redefine_pass.html',
        });

        console.log('sendMail OK, messageId=', info && info.messageId);
        if (usingTestAccount) {
            console.log('Preview URL (ethereal):', nodemailer.getTestMessageUrl(info));
        }

        return res.status(200).json({ message: 'Email de recuperação enviado!' });
    } catch (mailErr) {
        console.error('Erro ao enviar email (sendMail):', mailErr);

        // Detect common Gmail app-password error and give actionable advice
        let clientMessage = 'Erro interno ao enviar email';
        const isEAUTH = mailErr && mailErr.code === 'EAUTH';
        const resp = (mailErr && mailErr.response) || '';
        if (isEAUTH && (resp.includes('Application-specific password required') || resp.includes('InvalidSecondFactor'))) {
            clientMessage = 'Autenticação SMTP falhou: é necessário gerar uma App Password no Gmail (conta com 2FA). Veja https://support.google.com/mail/?p=InvalidSecondFactor';
        } else if (isEAUTH && (resp.includes('Invalid credentials') || resp.includes('Invalid login'))) {
            clientMessage = 'Autenticação SMTP falhou: verifique SMTP_USER/SMTP_PASS nas variáveis de ambiente.';
        }

        // If authentication failed and we're in development, try a fallback: create an Ethereal test account and resend there
        if (isEAUTH && process.env.NODE_ENV !== 'production') {
            try {
                console.log('Tentando fallback: criando conta de teste Ethereal e reenviando o email (desenvolvimento)');
                const testAccount = await nodemailer.createTestAccount();
                const fallbackTransporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: { user: testAccount.user, pass: testAccount.pass },
                });
                const fallbackInfo = await fallbackTransporter.sendMail({
                    from: process.env.SMTP_FROM || 'Grupo 3 - NotaDez <no-reply@example.com>',
                    to: destino,
                    subject: 'Recuperação de Senha - NotaDez (fallback de desenvolvimento)',
                    text: 'Este é um e-mail de teste enviado via Ethereal porque o SMTP principal falhou. Link: http://localhost:3000/frontend/pages/redefine_pass.html',
                });
                const preview = nodemailer.getTestMessageUrl(fallbackInfo);
                console.log('Fallback enviado. Preview URL:', preview);
                return res.status(200).json({ message: 'Email enviado via fallback de desenvolvimento', previewUrl: preview });
            } catch (fallbackErr) {
                console.error('Fallback (ethereal) também falhou:', fallbackErr);
                // continue to return original diagnostic message below
            }
        }

        // Em ambiente de desenvolvimento, devolvemos detalhes para ajudar o debug
        if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
            return res.status(500).json({ message: clientMessage, error: mailErr && mailErr.message, response: mailErr && mailErr.response });
        }
        return res.status(500).json({ message: clientMessage });
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
