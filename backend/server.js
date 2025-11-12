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

// ---------------------------------------------------------------------
// ROTAS DE NOTAS / ALUNOS (students.html) -- Samuel Campovilla e Caua Bianchi
// ---------------------------------------------------------------------

// GET /api/notas?id_turma=1
app.get('/api/notas', async (req, res) => {
  const idTurma = req.query.id_turma;
  if (!idTurma) {
    return res.status(400).json({ message: 'id_turma é obrigatório.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // pega até 3 componentes da turma
    const componentes = await pegarComponentesTurma(connection, idTurma);
    const id1 = componentes[0]?.id_componente || null;
    const id2 = componentes[1]?.id_componente || null;
    const id3 = componentes[2]?.id_componente || null;

    const [rows] = await connection.execute(
      `SELECT 
          a.ra,
          a.nome,
          MAX(CASE WHEN ln.id_componente = ? THEN ln.valor_nota END) AS c1,
          MAX(CASE WHEN ln.id_componente = ? THEN ln.valor_nota END) AS c2,
          MAX(CASE WHEN ln.id_componente = ? THEN ln.valor_nota END) AS c3
        FROM matricula m
        JOIN alunos a ON m.id_aluno = a.ra
        LEFT JOIN lancamento_nota ln ON ln.id_matricula = m.id_matricula
       WHERE m.id_turma = ?
       GROUP BY a.ra, a.nome
       ORDER BY a.nome`,
      [id1, id2, id3, idTurma]
    );

    const alunos = rows.map(r => ({
      ra: r.ra,
      nome: r.nome,
      c1: r.c1 === null ? null : Number(r.c1),
      c2: r.c2 === null ? null : Number(r.c2),
      c3: r.c3 === null ? null : Number(r.c3),
    }));

    res.json({ componentes, alunos });
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    res.status(500).json({ message: 'Erro interno ao buscar notas.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// POST /api/notas/salvarLinha
app.post('/api/notas/salvarLinha', async (req, res) => {
  const { id_turma, ra, nome, c1, c2, c3 } = req.body;

  if (!id_turma || !ra || !nome) {
    return res.status(400).json({ message: 'id_turma, ra e nome são obrigatórios.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const idMatricula = await pegarIdMatricula(connection, id_turma, ra, nome);
    if (!idMatricula) {
      return res.status(500).json({ message: 'Não foi possível obter id_matricula.' });
    }

    // pega até 3 componentes dessa turma
    const componentes = await pegarComponentesTurma(connection, id_turma);
    const id1 = componentes[0]?.id_componente || null;
    const id2 = componentes[1]?.id_componente || null;
    const id3 = componentes[2]?.id_componente || null;

    await salvarNota(connection, idMatricula, id1, c1);
    await salvarNota(connection, idMatricula, id2, c2);
    await salvarNota(connection, idMatricula, id3, c3);

    // recalcula a média final a partir do que está em lancamento_nota
    await atualizarCalculoFinal(connection, id_turma, ra);

    res.status(200).json({ message: 'Notas salvas com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar linha de notas:', error);
    if (error && error.stack) console.error(error.stack);
    res.status(500).json({ message: 'Erro interno ao salvar notas.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// DELETE /api/notas/:ra?id_turma=1
app.delete('/api/notas/:ra', async (req, res) => {
  const ra = req.params.ra;
  const idTurma = req.query.id_turma;

  if (!idTurma || !ra) {
    return res.status(400).json({ message: 'id_turma e ra são obrigatórios.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // remove cálculo final dessa turma/aluno
    await connection.execute(
      'DELETE FROM calculo_final WHERE id_turma = ? AND id_aluno = ?',
      [idTurma, ra]
    );

    // apaga matrícula (lancamento_nota e auditoria_notas devem estar em ON DELETE CASCADE)
    const [result] = await connection.execute(
      'DELETE FROM matricula WHERE id_aluno = ? AND id_turma = ?',
      [ra, idTurma]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Matrícula não encontrada para esse aluno na turma.' });
    }

    // Se o aluno não tiver mais matrículas em nenhuma turma, remover o registro do aluno também
    const [rem] = await connection.execute(
      'SELECT COUNT(*) AS total FROM matricula WHERE id_aluno = ?',
      [ra]
    );
    const total = rem && rem[0] ? rem[0].total : 0;
    if (total === 0) {
      await connection.execute('DELETE FROM alunos WHERE ra = ?', [ra]);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover aluno da turma:', error);
    res.status(500).json({ message: 'Erro interno ao remover aluno.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// ---------------------------------------------------------------------
// criação e remoção de componentes de nota -- Samuel Campovilla e Caua Bianchi
// ---------------------------------------------------------------------
// POST /api/componentes  { id_turma, nome, sigla, descricao }
app.post('/api/componentes', async (req, res) => {
  const { id_turma, nome, sigla, descricao } = req.body;

  if (!id_turma || !nome || !sigla) {
    return res.status(400).json({ message: 'id_turma, nome e sigla são obrigatórios.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // descobrir disciplina da turma
    const [turmas] = await connection.execute(
      'SELECT id_disciplina FROM turmas WHERE id_turma = ?',
      [id_turma]
    );
    if (turmas.length === 0) {
      return res.status(404).json({ message: 'Turma não encontrada.' });
    }
    const idDisciplina = turmas[0].id_disciplina;

    // não permitir mais de 3 componentes por disciplina
    const [rowsCount] = await connection.execute(
      'SELECT COUNT(*) AS total FROM componente_nota WHERE id_disciplina = ?',
      [idDisciplina]
    );
    if (rowsCount[0].total >= 3) {
      return res.status(400).json({ message: 'Já existem 3 componentes para esta disciplina.' });
    }

    // inserir componente
    const [result] = await connection.execute(
      'INSERT INTO componente_nota (nome, sigla, descricao, id_disciplina) VALUES (?, ?, ?, ?)',
      [nome, sigla, descricao || null, idDisciplina]
    );

    // Depois de criar componente, recalcula o calculo_final para todos os alunos
    // de todas as turmas dessa disciplina (pois componentes são por disciplina)
    const [turmasDisc] = await connection.execute(
      'SELECT id_turma FROM turmas WHERE id_disciplina = ?',
      [idDisciplina]
    );

    for (const t of turmasDisc) {
      const idTurma = t.id_turma;
      const [matriculas] = await connection.execute(
        'SELECT id_aluno FROM matricula WHERE id_turma = ?',
        [idTurma]
      );
      for (const m of matriculas) {
        // atualizarCalculoFinal irá deletar ou inserir calculo_final conforme regras
        await atualizarCalculoFinal(connection, idTurma, m.id_aluno);
      }
    }

    res.status(201).json({
      message: 'Componente criado com sucesso.',
      id_componente: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar componente:', error);
    res.status(500).json({ message: 'Erro interno ao criar componente.' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// DELETE /api/componentes/:id
app.delete('/api/componentes/:id', async (req, res) => {
  const idComponente = req.params.id;
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    // antes de apagar, descobrir disciplina para recalcular depois
    const [compRows] = await connection.execute(
      'SELECT id_disciplina FROM componente_nota WHERE id_componente = ?',
      [idComponente]
    );
    if (!compRows || compRows.length === 0) {
      return res.status(404).json({ message: 'Componente não encontrado.' });
    }
    const idDisciplina = compRows[0].id_disciplina;

    const [result] = await connection.execute(
      'DELETE FROM componente_nota WHERE id_componente = ?',
      [idComponente]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Componente não encontrado.' });
    }

    // após remover componente, recalcular calculo_final para turmas da disciplina
    const [turmasDisc] = await connection.execute(
      'SELECT id_turma FROM turmas WHERE id_disciplina = ?',
      [idDisciplina]
    );
    for (const t of turmasDisc) {
      const idTurma = t.id_turma;
      const [matriculas] = await connection.execute(
        'SELECT id_aluno FROM matricula WHERE id_turma = ?',
        [idTurma]
      );
      for (const m of matriculas) {
        await atualizarCalculoFinal(connection, idTurma, m.id_aluno);
      }
    }

    // notas em lancamento_nota devem ser apagadas via ON DELETE CASCADE
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover componente:', error);
    res.status(500).json({ message: 'Erro interno ao remover componente.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ---------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------
app.listen(port, () => {
  console.log(`Servidor aberto em http://localhost:${port}`);
});
