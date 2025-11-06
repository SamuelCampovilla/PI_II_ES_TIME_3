import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import * as authModule from './routes/auth.js';
import * as instituicoesModule from './routes/instituicoes.js';
import requireAuth from './middleware/requireAuth.js';
import * as dbModule from './db/pool.js';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();

// global error handlers to capture stack traces
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason && reason.stack ? reason.stack : reason);
});

// resolve pool safely (aceita várias formas de export)
let pool;
try {
  pool = dbModule.pool || dbModule.default || dbModule;
  if (!pool) {
    console.warn('DB pool resolved to falsy value:', pool);
  }
} catch (err) {
  console.error('Erro ao resolver dbModule:', err && err.stack ? err.stack : err);
  pool = undefined;
}

// middlewares
app.set('trust proxy', 1);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5501';
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static assets
app.use('/frontend', express.static(path.join(process.cwd(), 'frontend')));
app.use('/backend', express.static(path.join(process.cwd(), 'backend')));
app.use(express.static(path.join(process.cwd(), 'frontend')));

// session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-trocar-depois',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// helper que suporta pool.execute (mysql2) ou pool.query (pg)
async function executeQuery(sql, params = []) {
  if (!pool) throw new Error('DB pool não configurado (pool is undefined)');
  if (typeof pool.execute === 'function') {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } else if (typeof pool.query === 'function') {
    const count = (sql.match(/\?/g) || []).length;
    if (count > 0) {
      let i = 0;
      const converted = sql.replace(/\?/g, () => `$${++i}`);
      const res = await pool.query(converted, params);
      return res.rows;
    }
    const res = await pool.query(sql, params);
    return res.rows || res;
  }
  throw new Error('DB pool não suporta execute/query');
}

// health/debug endpoints
app.get('/ping', (_req, res) => res.status(200).send('ok'));
app.get('/debug/db', async (_req, res) => {
  try {
    const rows = await executeQuery('SELECT NOW() as now');
    res.json({ ok: true, now: rows[0]?.now || rows });
  } catch (err) {
    console.error('/debug/db error:', err && err.stack ? err.stack : err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Rota de cadastro adicionada diretamente no server.js
app.post('/auth/signup', async (req, res) => {
  const { nome, email, senha, telefone } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ success: false, message: 'nome, email e senha são obrigatórios' });
  }

  try {
    // checa existência
    const existing = await executeQuery('SELECT id_docente FROM docente WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email já cadastrado' });
    }

    // Inserção - executeQuery converte placeholders ? -> $n para PG
   const hashed = await bcrypt.hash(senha, 10);

    // inserir apenas as colunas que existem (id_docente é automático)
    await executeQuery(
      'INSERT INTO docente (nome, email, senha, telefone) VALUES (?, ?, ?, ?)',
      [nome, email, hashed, telefone || null]
    );

    // buscar registro recém-inserido para retornar id e nome
    const rows = await executeQuery('SELECT id_docente, nome FROM docente WHERE email = ? LIMIT 1', [email]);
    const user = Array.isArray(rows) && rows[0] ? rows[0] : { nome };

    return res.status(201).json({ success: true, user });
  } catch (err) {
    console.error('auth.signup error:', err && err.stack ? err.stack : err);
    if (err && err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Registro já existe' });
    }
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

// mount router helper (tolerante a formatos)
function mountImport(pathMount, moduleImport) {
  try {
    if (!moduleImport) return;
    // module could be { default: router } or Router directly or a factory function
    const m = moduleImport.default || moduleImport;
    if (!m) return;
    if (typeof m === 'function' && m.length === 0) {
      const maybeRouter = m();
      app.use(pathMount, maybeRouter);
      return;
    }
    if (typeof m === 'function') {
      app.use(pathMount, m);
      return;
    }
    app.use(pathMount, m);
  } catch (err) {
    console.error(`Erro ao montar router em ${pathMount}:`, err && err.stack ? err.stack : err);
  }
}

mountImport('/auth', authModule);
mountImport('/api', instituicoesModule);

// example protected endpoint using executeQuery helper
app.get('/api/user', requireAuth, async (req, res) => {
  try {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Não autenticado' });
    const rows = await executeQuery(
      'SELECT id_docente, nome, email, telefone FROM docente WHERE id_docente = ?',
      [req.session.userId]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});