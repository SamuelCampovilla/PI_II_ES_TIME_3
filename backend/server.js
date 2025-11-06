import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';  
import { pool } from './db/pool.js';
import authRouter from './routes/auth.js';
import instituicoesRouter from './routes/instituicoes.js';
import requireAuth from './middleware/requireAuth.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

app.use(express.json());

app.use('/frontend', express.static('frontend'));

app.use('/backend', express.static('backend'));

app.use(express.static('frontend'));

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


const noLimiter = (req, _res, next) => next();
app.use('/auth', authRouter(noLimiter));

app.use('/api', instituicoesRouter);

app.get('/api/user', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id_docente, nome, email, telefone FROM docente WHERE id_docente = ?',
      [req.session.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err.message);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
