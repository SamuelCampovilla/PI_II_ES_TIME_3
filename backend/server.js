// código do servidor - Caio Polo - Samuel Campovilla - Vinicius Castro - Caua Bianchi

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { dbConfig } from '../index.js';
import nodemailer from 'nodemailer';
import { createConnection } from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', 
    port: 587,
    secure: false, 
    auth: {
        user: 'projetonotadezgrupo3@gmail.com',
        pass: 'makfcsgsbcyvvncb' 
    },
    tls: {
        rejectUnauthorized: false 
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/src')));
app.use(express.static(path.join(__dirname, 'src')));

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


async function atualizarCalculoFinal(connection, idTurma, ra) {

  const componentes = await pegarComponentesTurma(connection, idTurma);
  const componentesCount = componentes.length;

 
  if (componentesCount === 0) {
    await connection.execute(
      'DELETE FROM calculo_final WHERE id_turma = ? AND id_aluno = ?',
      [idTurma, ra]
    );
    return;
  }


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


app.get('/frontend/pages/menagementPage.html', (req, res)=>{
    res.sendFile(path.join(__dirname, '../frontend/pages/menagementPage.html'));
});

app.get('/frontend/pages/menagementPage.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/menagementPage.html'));
});

app.get('/frontend/pages/students.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/students.html'));
});

app.get('/me', (req, res) => {
  res.status(401).json({ message: 'Sessão não autenticada.' });
});

app.get('/notas', async (req, res) => {
  const idTurma = Number(req.query.id_turma);
  if (!idTurma) {
    return res.status(400).json({ message: 'id_turma é obrigatório.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const componentes = await pegarComponentesTurma(connection, idTurma);

    const [matriculas] = await connection.execute(
      `SELECT m.id_matricula, a.ra, a.nome
         FROM matricula m
         JOIN alunos a ON a.ra = m.id_aluno
        WHERE m.id_turma = ?
        ORDER BY a.nome`,
      [idTurma]
    );

    const compIndex = new Map(componentes.map((comp, index) => [comp.id_componente, index]));
    const alunos = matriculas.map(row => ({
      ra: row.ra,
      nome: row.nome,
      c1: null,
      c2: null,
      c3: null,
      _id_matricula: row.id_matricula
    }));

    if (alunos.length && componentes.length) {
      const idsMatricula = alunos.map(a => a._id_matricula);
      const placeholders = idsMatricula.map(() => '?').join(',');
      const [notas] = await connection.execute(
        `SELECT id_matricula, id_componente, valor_nota
           FROM lancamento_nota
          WHERE id_matricula IN (${placeholders})`,
        idsMatricula
      );

      const alunoPorMatricula = new Map(alunos.map(a => [a._id_matricula, a]));
      notas.forEach(nota => {
        const aluno = alunoPorMatricula.get(nota.id_matricula);
        if (!aluno) return;
        const compPos = compIndex.get(nota.id_componente);
        if (compPos === undefined) return;
        const campo = `c${compPos + 1}`;
        aluno[campo] = nota.valor_nota;
      });
    }

    const resposta = alunos.map(({ _id_matricula, ...rest }) => rest);
    res.json({ componentes, alunos: resposta });
  } catch (error) {
    console.error('Erro ao carregar notas:', error);
    res.status(500).json({ message: 'Erro ao carregar notas.' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/notas/salvarLinha', async (req, res) => {
  const { id_turma, ra, nome, c1 = null, c2 = null, c3 = null } = req.body || {};

  if (!id_turma || !ra || !nome) {
    return res.status(400).json({ message: 'id_turma, ra e nome são obrigatórios.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const idMatricula = await pegarIdMatricula(connection, id_turma, ra, nome);
    const componentes = await pegarComponentesTurma(connection, id_turma);
    const valores = [c1, c2, c3];

    for (let i = 0; i < componentes.length && i < 3; i++) {
      await salvarNota(connection, idMatricula, componentes[i].id_componente, valores[i]);
    }

    await atualizarCalculoFinal(connection, id_turma, ra);
    res.json({ message: 'Aluno e notas salvos com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar aluno/notas:', error);
    res.status(500).json({ message: 'Erro ao salvar aluno/notas.' });
  } finally {
    if (connection) await connection.end();
  }
});

app.delete('/notas/:ra', async (req, res) => {
  const ra = req.params.ra;
  const idTurma = Number(req.query.id_turma);

  if (!ra || !idTurma) {
    return res.status(400).json({ message: 'ra e id_turma são obrigatórios.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id_matricula FROM matricula WHERE id_aluno = ? AND id_turma = ?',
      [ra, idTurma]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Aluno não encontrado na turma.' });
    }

    const idMatricula = rows[0].id_matricula;
    await connection.execute('DELETE FROM lancamento_nota WHERE id_matricula = ?', [idMatricula]);
    await connection.execute('DELETE FROM calculo_final WHERE id_turma = ? AND id_aluno = ?', [idTurma, ra]);
    await connection.execute('DELETE FROM matricula WHERE id_matricula = ?', [idMatricula]);

    const [restantes] = await connection.execute(
      'SELECT 1 FROM matricula WHERE id_aluno = ? LIMIT 1',
      [ra]
    );
    if (!restantes.length) {
      await connection.execute('DELETE FROM alunos WHERE ra = ?', [ra]);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover aluno:', error);
    res.status(500).json({ message: 'Erro ao remover aluno.' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/componentes', async (req, res) => {
  const { id_turma, nome, sigla, descricao } = req.body || {};
  if (!id_turma || !nome || !sigla) {
    return res.status(400).json({ message: 'id_turma, nome e sigla são obrigatórios.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [turmaRows] = await connection.execute(
      'SELECT id_disciplina FROM turmas WHERE id_turma = ?',
      [id_turma]
    );

    if (!turmaRows.length) {
      return res.status(404).json({ message: 'Turma não encontrada.' });
    }

    const idDisciplina = turmaRows[0].id_disciplina;
    const [result] = await connection.execute(
      'INSERT INTO componente_nota (id_disciplina, nome, sigla, descricao) VALUES (?, ?, ?, ?)',
      [idDisciplina, nome, sigla, descricao || null]
    );

    res.status(201).json({
      id_componente: result.insertId,
      nome,
      sigla
    });
  } catch (error) {
    console.error('Erro ao criar componente:', error);
    res.status(500).json({ message: 'Erro ao criar componente.' });
  } finally {
    if (connection) await connection.end();
  }
});

app.delete('/componentes/:id', async (req, res) => {
  const idComponente = Number(req.params.id);
  if (!idComponente) {
    return res.status(400).json({ message: 'id do componente é obrigatório.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [info] = await connection.execute(
      `SELECT t.id_turma
         FROM componente_nota cn
         JOIN turmas t ON t.id_disciplina = cn.id_disciplina
        WHERE cn.id_componente = ?`,
      [idComponente]
    );

    const turmaId = info.length ? info[0].id_turma : null;

    await connection.execute('DELETE FROM lancamento_nota WHERE id_componente = ?', [idComponente]);
    const [result] = await connection.execute(
      'DELETE FROM componente_nota WHERE id_componente = ?',
      [idComponente]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Componente não encontrado.' });
    }

    if (turmaId) {
      const [alunosTurma] = await connection.execute(
        'SELECT DISTINCT id_aluno FROM matricula WHERE id_turma = ?',
        [turmaId]
      );

      for (const aluno of alunosTurma) {
        await atualizarCalculoFinal(connection, turmaId, aluno.id_aluno);
      }
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover componente:', error);
    res.status(500).json({ message: 'Erro ao remover componente.' });
  } finally {
    if (connection) await connection.end();
  }
});


//---------------------------------------------------------------------------------------------------//
// Rota para buscar uma instituição por ID

app.get('/institution/:id', async (req, res) => {
    const { id } = req.params;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const query = 'SELECT * FROM instituicoes WHERE id_instituicao = ?';
        const [resultado] = await connection.execute(query, [id]);

        if (resultado.length === 0) {
            return res.status(404).json({ message: 'Instituição não encontrada' });
        }

        res.json(resultado[0]);
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
              console.log('Email enviado caso o email exista:', info.response);
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




//-------------------------------------------------------------------------------------------------------------

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
//---------------------------------------------------------------------------------------------------------



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

app.get('/disciplinas', async (req, res) => {
    const courseId = req.query.courseId ?? req.query.cursoId;
    let connection;
    if (!courseId) {
        return res.status(400).json({ message: 'O ID do curso é obrigatório (use courseId ou cursoId).' });
    }
    try {
        connection = await mysql.createConnection(dbConfig);
        const query = 'SELECT * FROM disciplinas WHERE id_curso = ?';
        const [disciplinas] = await connection.execute(query, [courseId]);
        return res.status(200).json({ disciplinas });
    } catch (error) {
        console.error('Erro ao buscar disciplinas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

app.post('/adddisciplina', async (req, res) => {
    const { nome_disciplina, codigo_disciplina, periodo, curso_id, instituicao_id } = req.body;
    let connection;
    
    if (!curso_id || !nome_disciplina || !codigo_disciplina || !periodo) {
        return res.status(400).json({ 
            message: 'ID do curso, nome da disciplina, código e período são obrigatórios.' 
        });
    }
    
    try {
        connection = await mysql.createConnection(dbConfig);
        const query = 'INSERT INTO disciplinas (nome_disciplina, codigo_disciplina, periodo, id_curso, id_instituicao) VALUES (?, ?, ?, ?, ?)';
        const [result] = await connection.execute(query, [nome_disciplina, codigo_disciplina, periodo, curso_id, instituicao_id]);
        return res.status(201).json({
            message: 'Disciplina adicionada com sucesso!',
            id: result.insertId
        });
    } catch (error) {
        console.error('Erro ao adicionar disciplina:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});
// Deletar disciplina por código (codigo_disciplina)
app.delete('/deleteDisciplina', async (req, res) => {
  const codigo = req.query.codigo;
  if (!codigo) {
    return res.status(400).json({ message: 'O código da disciplina é obrigatório (query string ?codigo=).' });
  }
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    // checa se existem turmas vinculadas
    const [turmas] = await connection.execute('SELECT 1 FROM turmas WHERE id_disciplina = ?', [codigo]);
    if (turmas.length) {
      return res.status(409).json({ message: 'Não é possível excluir, pois existem alunos associados às turmas desta disciplina.' });
    }

    const query = 'DELETE FROM disciplinas WHERE codigo_disciplina = ?';
    const [result] = await connection.execute(query, [codigo]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Disciplina não encontrada para o código informado.' });
    }
    return res.status(200).json({ message: 'Disciplina deletada com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar disciplina por código:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/turmas', async (req, res) => {
    const disciplinaCodigo = req.query.codigo_disciplina;
    if (!disciplinaCodigo) {
        // Return empty array if no code is provided, as the frontend might call this without a code
        return res.status(200).json({ turmas: [] });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // This assumes the foreign key in 'turmas' is 'id_disciplina' but it holds the 'codigo_disciplina' value.
        const query = 'SELECT * FROM turmas WHERE id_disciplina = ?';
        const [turmas] = await connection.execute(query, [disciplinaCodigo]);
        return res.status(200).json({ turmas });
    } catch (error) {
        console.error('Erro ao buscar turmas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        if (connection) await connection.end();
    }
});

app.delete('/deleteCurso', async (req, res) => {
    const courseId = req.query.courseId;
    if (!courseId) {
        return res.status(400).json({ message: 'O ID do curso é obrigatório.' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const [disciplinas] = await connection.execute('SELECT 1 FROM disciplinas WHERE id_curso = ?', [courseId]);
        if (disciplinas.length > 0) {
            return res.status(409).json({ message: 'Não é possível excluir. Existem disciplinas vinculadas a este curso.' });
        }

        const [result] = await connection.execute('DELETE FROM cursos WHERE id_curso = ?', [courseId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Curso não encontrado.' });
        }

        return res.status(200).json({ message: 'Curso excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar curso:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        if (connection) await connection.end();
    }
});

app.delete('/deleteTurma', async (req, res) => {
    const turmaId = req.query.turmaId;
    if (!turmaId) {
        return res.status(400).json({ message: 'O ID da turma é obrigatório.' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const [alunos] = await connection.execute('SELECT 1 FROM matricula WHERE id_turma = ?', [turmaId]);
        if (alunos.length > 0) {
            return res.status(409).json({ message: 'Não é possível excluir. Existem alunos vinculados a esta turma.' });
        }

        const [result] = await connection.execute('DELETE FROM turmas WHERE id_turma = ?', [turmaId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Turma não encontrada.' });
        }

        return res.status(200).json({ message: 'Turma excluída com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar turma:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        if (connection) await connection.end();
    }
});



//---------------------------------------------------------------------------------------------------------------------
// adicionar turmas

app.post('/addTurma', async(req, res)=>{
  const {id_disciplina, codigo_turma, nome_turma} = req.body;
  let connection;

  if(!id_disciplina){
    return res.status(400).json({message: 'Erro ao coletar id da disciplina.'});
  }
  if(!codigo_turma){
    return res.status(400).json({message: 'Código de turma é obrigatorio'});
  }
  if(!nome_turma){
    return res.status(400).json({message: 'Nome da turma é obrigatorio'});
  }
  try{
    connection = await mysql.createConnection(dbConfig);
    const query = 'INSERT INTO turmas (codigo_turma, nome_turma, id_disciplina) VALUES (?,?,?)';
    const [result] = await connection.execute(query, [codigo_turma, nome_turma, id_disciplina]);
    return res.status(201).json({message: 'Turma adicionada com sucesso',id: result.insertId});
  }catch(error){
      console.error('Erro ao adicionar Turma:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
  }finally{
    if (connection) {
      await connection.end();
    }
  }
});

//------------------------------------------------------------------------------------------------------
// buscar turmas adicionada em disciplina


app.get('/BuscarTurmas', async(req, res)=>{
  const disciplinaId = req.query.disciplinaId;
  let connection
  if(!disciplinaId){
    return res.status(400).json({message: "Id de disciplinas não encontrado."});
  }
  try{
    connection = await mysql.createConnection(dbConfig);
    const query = 'SELECT * FROM turmas WHERE id_disciplina = ?'
    const [turmas] = await connection.execute(query, [disciplinaId]) 
    return res.status(200).json({ turmas });
  }catch(error){
    console.error('Erro ao buscar turmas:', error);
    return res.status(500).json({message: 'erro interno do servidor.'});
  }finally{
    if(connection){
      await connection.end();
    }
  }

});



app.listen(port, () => {
  console.log(`Servidor aberto em http://localhost:${port}`);
});

//---------------------------------------------------------------------------------------------------//

