// código do servidor - Caio Polo - Samuel Campovilla - Vinicius Castro - Caua Bianchi

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
  auth: {
    user: 'projetonotadezgrupo3@gmail.com',
    pass: 'egleaakcifizvpgu'
  },
  tls: {
    rejectUnauthorized: false
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/src')));

// ---------------------------------------------------------------------
// HELPERS -- Samuel Campovilla e Caua Bianchi
// ---------------------------------------------------------------------

// Garante aluno + matrícula e devolve id_matricula
async function pegarIdMatricula(connection, idTurma, ra, nomeAluno) {
  await connection.execute(
    'INSERT IGNORE INTO alunos (ra, nome) VALUES (?, ?)',
    [ra, nomeAluno]
  );

  // Verifica se já existe matrícula para esse aluno nessa turma
  const [existing] = await connection.execute(
    'SELECT id_matricula FROM matricula WHERE id_aluno = ? AND id_turma = ?',
    [ra, idTurma]
  );
  if (existing && existing.length > 0) {
    return existing[0].id_matricula;
  }

  // Insere apenas se não existir
  const [ins] = await connection.execute(
    'INSERT INTO matricula (id_aluno, id_turma) VALUES (?, ?)',
    [ra, idTurma]
  );

  // Se insertId não disponível, buscar novamente
  if (ins && ins.insertId) return ins.insertId;

  const [rows] = await connection.execute(
    'SELECT id_matricula FROM matricula WHERE id_aluno = ? AND id_turma = ?',
    [ra, idTurma]
  );
  if (rows.length === 0) return null;
  return rows[0].id_matricula;
}

// Busca até 3 componentes de nota da disciplina dessa turma
async function pegarComponentesTurma(connection, idTurma) {
  const [rows] = await connection.execute(
    `SELECT cn.id_componente, cn.sigla
       FROM turmas t
       JOIN componente_nota cn ON cn.id_disciplina = t.id_disciplina
      WHERE t.id_turma = ?
      ORDER BY cn.id_componente
      LIMIT 3`,
    [idTurma]
  );
  return rows; // [{id_componente, sigla}, ...]
}

// Salva, atualiza ou apaga uma nota em lancamento_nota
async function salvarNota(connection, idMatricula, idComponente, valor) {
  if (!idComponente) return; // se não existe componente na coluna

  // se valor é nulo, apagamos eventual lançamento
  if (valor === null || valor === undefined || valor === '') {
    await connection.execute(
      'DELETE FROM lancamento_nota WHERE id_matricula = ? AND id_componente = ?',
      [idMatricula, idComponente]
    );
    return;
  }

  const notaNum = Number(valor);
  if (isNaN(notaNum)) return;

  const [resultUpdate] = await connection.execute(
    'UPDATE lancamento_nota SET valor_nota = ? WHERE id_matricula = ? AND id_componente = ?',
    [notaNum, idMatricula, idComponente]
  );

  if (resultUpdate.affectedRows === 0) {
    await connection.execute(
      'INSERT INTO lancamento_nota (id_matricula, id_componente, valor_nota) VALUES (?, ?, ?)',
      [idMatricula, idComponente, notaNum]
    );
  }
}

// Atualiza / grava nota final do aluno (tabela calculo_final)
// Agora busca as notas diretamente do banco (lancamento_nota + matricula)
async function atualizarCalculoFinal(connection, idTurma, ra) {
  // 1) Verifica se existem 3 componentes para a turma
  const componentes = await pegarComponentesTurma(connection, idTurma);
  const componentesCount = componentes.length;

  // Se não há componentes cadastrados para a turma, remover qualquer cálculo antigo
  if (componentesCount === 0) {
    await connection.execute(
      'DELETE FROM calculo_final WHERE id_turma = ? AND id_aluno = ?',
      [idTurma, ra]
    );
    return;
  }

  // 2) Busca as notas lançadas para esse aluno/turma
  const [rowsNotas] = await connection.execute(
    `SELECT ln.valor_nota
       FROM matricula m
       JOIN lancamento_nota ln ON ln.id_matricula = m.id_matricula
      WHERE m.id_turma = ? AND m.id_aluno = ?
      ORDER BY ln.id_componente
      LIMIT 3`,
    [idTurma, ra]
  );

  // Mapear notas; tratar null como 0 para o cálculo (requisito). Sempre calculamos divisor = 3 (C1,C2,C3)
  const notas = [0, 0, 0];
  for (let i = 0; i < rowsNotas.length && i < 3; i++) {
    const val = rowsNotas[i].valor_nota;
    notas[i] = val == null ? 0 : Number(val);
  }

  if (notas.some(n => Number.isNaN(n))) {
    // erro: não grava cálculo, remove registro antigo para manter consistência
    await connection.execute(
      'DELETE FROM calculo_final WHERE id_turma = ? AND id_aluno = ?',
      [idTurma, ra]
    );
    return;
  }

  const soma = notas.reduce((acc, n) => acc + n, 0);
  const media = Number((soma / 3).toFixed(2));

  await connection.execute(
    `INSERT INTO calculo_final (id_turma, id_aluno, nota_final)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE nota_final = VALUES(nota_final)`,
    [idTurma, ra, media]
  );
}

// ---------------------------------------------------------------------
// ROTAS DE PÁGINAS -- Caio Polo, Caua Bianchi, Samuel Campovilla e Vinicius Castro
// ---------------------------------------------------------------------

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/src/index.html'));
});

app.get('/frontend/pages/forgotpassword.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/forgotpassword.html'));
});

app.get('/frontend/pages/redefine_pass.html', (req, res) => {
  console.log('Query params recebidos:', req.query);
  res.sendFile(path.join(__dirname, '../frontend/pages/redefine_pass.html'));
});

app.get('/frontend/pages/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/signup.html'));
});

app.get('/frontend/pages/instituicao.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/instituicao.html'));
});

// página de alunos / quadro de notas
app.get('/frontend/pages/students.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/students.html'));
});

app.get('/frontend/pages/menagementPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/menagementPage.html'));
});

// ---------------------------------------------------------------------
// Cadastro de usuário - Caio Polo
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// Login - Caio Polo
// ---------------------------------------------------------------------
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let connection;
  if (!email || !password) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = 'SELECT email, senha FROM docentes WHERE email = ? and senha = ?';
    const [result] = await connection.execute(query, [email, password]);

    if (result && result.length === 1) {
      return res.status(200).json({ message: 'Login correto!' });
    } else {
      return res.status(401).json({ message: 'Email ou senha inválidos!' });
    }
  } catch (error) {
    console.error('Erro ao entrar.', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });

  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// ---------------------------------------------------------------------
// Recuperação de senha - Vinicius Castro e Caio Polo
// ---------------------------------------------------------------------
app.post('/forgot', async (req, res) => {
  const { email } = req.body;
  let connection;

  if (!email) {
    return res.status(400).json({ message: 'O campo de email é obrigatório' });
  }
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = 'SELECT email FROM docentes WHERE email = ?';
    const [result] = await connection.execute(query, [email]);

    if (result && result.length === 1) {
      const mail = {
        from: 'projetonotadezgrupo3@gmail.com',
        to: email,
        subject: 'Recuperação de senha NotaDez.',
        html: `<h3>Olá!</h3>
                <p>Você solicitou a recuperação de senha do NotaDez.</p>
                <p>Clique neste link para redefinir sua senha: 
                <a href="http://localhost:3000/frontend/pages/redefine_pass.html?email=${email}">Redefinir Senha</a></p>`
      };

      try {
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
      } catch (errorMail) {
        console.error('ERRO AO ENVIAR EMAIL:', errorMail);
        return res.status(500).json({
          message: 'Erro ao enviar o email de recuperação. Por favor, tente novamente.'
        });
      }
    } else {
      return res.status(401).json({ message: 'Email inválido! tente novamente com outro e-mail' });

    }

  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }

});

// ---------------------------------------------------------------------
// Redefinir senha - Vinicius Castro
// ---------------------------------------------------------------------
app.post('/redefinepassword', async (req, res) => {
  console.log('Body recebido:', req.body);
  console.log('Query params:', req.query);

  const emailAtualizar = req.query.email;
  const { novaSenha } = req.body;

  let connection;

  if (!novaSenha || !emailAtualizar) {
    return res.status(400).json({ message: 'Nova senha é obrigatorio' });
  }

  try {
    connection = await mysql.createConnection(dbConfig);
    const query = 'UPDATE docentes SET senha = ? WHERE email = ?';
    const [result] = await connection.execute(query, [novaSenha, emailAtualizar]);
    if (result.affectedRows === 1) {
      return res.status(200).json({ message: 'Senha redefinida com sucesso!' });
    } else {
      return res.status(404).json({ message: 'Email não encontrado. Não foi possível redefinir a senha.' });
    }
  } catch (error) {
    console.error('Erro ao redefinir a senha:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// ---------------------------------------------------------------------
// Pegar id do docente -- Caio Polo
// ---------------------------------------------------------------------
app.get('/docente/id', async (req, res) => {
  const email = req.query.email;
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    const query = 'SELECT id_docente FROM docentes WHERE email = ?';
    const [resultado] = await connection.execute(query, [email]);

    if (resultado.length === 1) {
      return res.status(200).json({ id: resultado[0].id_docente });
    } else {
      return res.status(404).json({ message: 'Docente não encontrado no banco.' });
    }
  } catch (error) {
    console.error('Erro ao buscar docente', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});
//---------------------------------------------------------------------------------------------------//

//pegar nome do docente

app.get('/instituicaoNomeDocente', async(req, res)=>{{
    const docenteId = req.query.docenteId;
    let connection;
    try{
        let connection = await mysql.createConnection(dbConfig);
        const query = 'SELECT nome FROM docentes WHERE id_docente = ?';
        const [result] = await connection.execute(query, [docenteId]);
        if(result.length === 1){
            return res.status(200).json({ nomeDocente: result[0].nome });
        }
    }catch(error){
        console.error('Nao foi possivel encontrar docente.');
        return res.status(500).json({message: 'Erro interno do servidor.'})
    }finally{
        await connection.end();
    }
}});


// ---------------------------------------------------------------------
// Adicionar instituição -- Caio Polo
// ---------------------------------------------------------------------
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


//---------------------------------------------------------------------------------------------------//
//pegar instituicoes vinculadas ao docente - caio Polo

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




app.listen(port, () => {
  console.log(`Servidor aberto em http://localhost:${port}`);
});
