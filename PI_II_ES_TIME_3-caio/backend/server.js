//código do servidor - Caio Polo - Samuel Campovilla - Vinicius castro - Caua Bianchi

import express from 'express';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
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

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/src')));
app.use(express.static(path.join(__dirname, 'src')));

//---------------------------------------------------------------------------------------------------//

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/src/index.html'));
});

app.get('/frontend/pages/forgotpassword.html', (req, res) =>{
    res.sendFile(path.join(__dirname, '../frontend/pages/forgotpassword.html'));
})

app.get('/frontend/pages/redefine_pass.html', (req, res) =>{
    console.log('Query params recebidos:', req.query);
    res.sendFile(path.join(__dirname, '../frontend/pages/redefine_pass.html'));
})

app.get('/frontend/pages/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/signup.html'));
});


app.get('/frontend/pages/instituicao.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/instituicao.html'));
});


app.get('/frontend/pages/instituicao.html', (req, res)=>{
    res.sendFile(path.join(__dirname, '../frontend/pages/instituicao.html'));
});

app.get('/frontend/pages/menagementPage.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/menagementPage.html'));
});

//---------------------------------------------------------------------------------------------------//

// Rota para buscar uma instituição por ID
app.get('/institution/:id', async (req, res) => {
    const { id } = req.params;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const query = 'SELECT * FROM instituicoes WHERE id_instituicao = ?';
        const [rows] = await connection.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Instituição não encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erro ao buscar instituição:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});
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
                        <a href="http://localhost:3000/frontend/pages/redefine_pass.html?email=${email}">Redefinir Senha</a></p>
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

// redefinir senha - Vinicius Castro

app.post('/redefinepassword', async(req, res) =>{
    console.log('Body recebido:', req.body);
    console.log('Query params:', req.query);

    const emailAtualizar = req.query.email;
    const { novaSenha } = req.body;
    
    
    let connection;
    
    if(!novaSenha || !emailAtualizar){
        return res.status(400).json({ message: 'Nova senha é obrigatorio' });
    }

    try{
        connection = await mysql.createConnection(dbConfig);
        const query = 'UPDATE docentes SET senha = ? WHERE email = ?';
        const [result] = await connection.execute(query, [novaSenha, emailAtualizar]);
        if(result.affectedRows === 1){
            return res.status(200).json({ message: 'Senha redefinida com sucesso!' });
        }else{
            return res.status(404).json({ message: 'Email não encontrado. Não foi possível redefinir a senha.' });
        }
    }catch(error){
        console.error('Erro ao redefinir a senha:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }finally{
        if(connection){
            await connection.end();
        }
    }
});


//---------------------------------------------------------------------------------------------------//



//pegar id do docente -- caio Polo

app.get('/docente/id', async(req, res) =>{
    const email = req.query.email;
    let connection

    try{
        connection = await mysql.createConnection(dbConfig);
        const query = 'SELECT id_docente FROM docentes WHERE email = ?';
        const [resultado] = await connection.execute(query, [email]);   
        
        if(resultado.length === 1){
            return res.status(200).json({id: resultado[0].id_docente});
        }else{
            return res.status(404).json({ message: 'Docente não encontrado no banco.' });
        }
    }catch(error){
        console.error('Erro ao buscar docente', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }finally{
        if(connection){
            await connection.end();
        }
    }


});



//---------------------------------------------------------------------------------------------------//

// codigo para adiconar instituicao -- caio Polo
app.post('/instituicao', async (req, res) => {
    const docenteId = req.query.id;
    const { nomeInstituicao } = req.body;

    if (!nomeInstituicao) {
        return res.status(400).json({ message: 'Nome da instituição é obrigatório.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const encontrarInstituicaoQuery = 'SELECT id_instituicao FROM instituicoes WHERE nome_instituicao = ?';
        const [found] = await connection.execute(encontrarInstituicaoQuery, [nomeInstituicao]);

        let idInstituicao;
        if (found && found.length === 1) {
            idInstituicao = found[0].id_instituicao;
        } else {
            const insertInstituicaoQuery = 'INSERT INTO instituicoes (nome_instituicao) VALUES (?)';
            const [InsertResultado] = await connection.execute(insertInstituicaoQuery, [nomeInstituicao]);
            idInstituicao = InsertResultado.insertId;
        }

        const checarVinculoQuery = 'SELECT 1 FROM docente_instituicao WHERE id_docente = ? AND id_instituicao = ?';
        const [vinculo] = await connection.execute(checarVinculoQuery, [docenteId, idInstituicao]);
        if (vinculo && vinculo.length > 0) {
            return res.status(409).json({ message: 'Docente já está vinculado a esta instituição.' });
        }

   
        const insertRelQuery = 'INSERT INTO docente_instituicao (id_docente, id_instituicao) VALUES (?, ?)';
        await connection.execute(insertRelQuery, [docenteId, idInstituicao]);

        return res.status(201).json({
            message: 'Instituição e vínculo criados com sucesso.',
            id: idInstituicao
        });
    } catch (error) {
        console.error('Erro ao criar instituição/vínculo:', error);
        return res.status(500).json({ message: 'Erro interno no servidor.' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});


//---------------------------------------------------------------------------------------------------//

    app.get('/pegarInstituicoes', async(req, res) =>{
        const docenteId = req.query.docenteId;
        let connection;
        try{
            connection = await mysql.createConnection(dbConfig);
            const query = `SELECT 
                    i.id_instituicao, 
                    i.nome_instituicao 
                FROM 
                    docente_instituicao AS di
                JOIN 
                    instituicoes AS i ON di.id_instituicao = i.id_instituicao
                WHERE 
                    di.id_docente = ?;
            `;
            const [instituicoes] = await connection.execute(query, [docenteId]);
            return res.status(200).json({ instituicoes });
        }catch(error){
            console.error('Erro ao buscar instituições:', error);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    });

    app.post('/addCurso', async(req, res) =>{
        const institutionId = req.query.institutionId;
        const { courseName } = req.body;
        let connection;

        if(!courseName){
            return res.status(400).json({ message: 'Nome do curso é obrigatório.' });
        }
        try{
            connection = await mysql.createConnection(dbConfig);
            const query = 'INSERT INTO cursos (nome_curso, id_instituicao) VALUES (?, ?)';
            const [result] = await connection.execute(query, [courseName, institutionId]);
            return res.status(201).json({
                message: 'Curso adicionado com sucesso!',
                id: result.insertId
            });
        }catch(error){
            console.error('Erro ao adicionar curso:', error);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    });

    app.get('/cursos', async (req, res) => {
        const institutionId = req.query.institutionId;
        let connection;
    
        if (!institutionId) {
            return res.status(400).json({ message: 'O ID da instituição é obrigatório.' });
        }
    
        try {
            connection = await mysql.createConnection(dbConfig);
            const query = 'SELECT * FROM cursos WHERE id_instituicao = ?';
            const [cursos] = await connection.execute(query, [institutionId]);
            return res.status(200).json({ cursos });
        } catch (error) {
            console.error('Erro ao buscar cursos:', error);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    });

    app.post('/addcursos', async (req, res) => {
        const { nome_curso, instituicao_id } = req.body;
        let connection;
        if (!nome_curso || !instituicao_id) {
            return res.status(400).json({ message: 'Nome do curso e ID da instituição são obrigatórios.' });
        }
        try {
            connection = await mysql.createConnection(dbConfig);
            const query = 'INSERT INTO cursos (nome_curso, id_instituicao) VALUES (?, ?)';
            const [result] = await connection.execute(query, [nome_curso, instituicao_id]);
            return res.status(201).json({
                message: 'Curso adicionado com sucesso!',
                id: result.insertId
            });
        } catch (error) {
            console.error('Erro ao adicionar curso:', error);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    });

    app.get('/pegarCursosInicial' , async (req, res) => {
        const institutionId = req.query.institutionId;
        let connection;
        if (!institutionId) {
            return res.status(400).json({ message: 'O ID da instituição é obrigatório.' });
        }
        try {
            connection = await mysql.createConnection(dbConfig);
            const query = 'SELECT * FROM cursos WHERE id_instituicao = ?';
            const [cursos] = await connection.execute(query, [institutionId]);
            return res.status(200).json({ cursos });
        }
        catch (error) {
            console.error('Erro ao buscar cursos:', error);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }
        finally {
            if (connection) {
                await connection.end();
            }
        }
    });


app.listen(port, () => {
    console.log(`Servidor aberto em http://localhost:${port}`);
});

//---------------------------------------------------------------------------------------------------//

