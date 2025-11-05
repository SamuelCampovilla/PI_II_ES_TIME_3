import express from 'express';
import { pool } from '../db/pool.js';

export default function authRouter(signinLimiter) {
  const router = express.Router();

  router.post('/signup', async (req, res) => {
    let { nome, email, telefone, senha } = req.body;

    if (!nome || !email || !telefone || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    nome = nome.trim();
    email = email.trim().toLowerCase();
    telefone = telefone.trim();

    if (nome.length === 0) {
      return res.status(400).json({ error: 'Nome não pode estar vazio' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (senha.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres' });
    }

    try {
      const [existing] = await pool.execute(
        'SELECT 1 FROM docente WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        return res.status(409).json({ error: 'Email já cadastrado' });
      }

      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(now);
      const getPart = (type) => parts.find(p => p.type === type).value;
      const brasiliaTimeString = `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;

      const [result] = await pool.execute(
        'INSERT INTO docente (nome, email, senha, telefone, criado_em) VALUES (?, ?, ?, ?, ?)',
        [nome, email, senha, telefone, brasiliaTimeString]
      );

      res.status(201).json({
        id_docente: result.insertId,
        nome,
        email,
        telefone
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email já cadastrado' });
      }
      console.error('Signup error details:');
      console.error('  Message:', error.message);
      console.error('  Code:', error.code);
      console.error('  SQL State:', error.sqlState);
      
      let errorMessage = 'Erro ao cadastrar usuário';
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Erro de conexão com o banco de dados. Verifique as configurações.';
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        errorMessage = 'Erro de autenticação no banco de dados. Verifique usuário e senha.';
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        errorMessage = 'Banco de dados não encontrado. Verifique o nome do banco.';
      } else if (error.code === 'ER_NO_SUCH_TABLE') {
        errorMessage = 'Tabela "docente" não encontrada. Verifique a estrutura do banco.';
      } else if (error.code === 'ER_BAD_FIELD_ERROR') {
        errorMessage = 'Erro na estrutura da tabela. Verifique as colunas.';
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  router.post('/signin', signinLimiter, async (req, res) => {
    let { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    email = email.trim().toLowerCase();

    try {
      const [rows] = await pool.execute(
        'SELECT id_docente, nome, email, senha FROM docente WHERE email = ?',
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const user = rows[0];
      if (senha !== user.senha) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regenerate error:', err.message);
          return res.status(500).json({ error: 'Erro ao criar sessão' });
        }

        req.session.userId = user.id_docente;
        req.session.userEmail = user.email;

        res.json({
          id_docente: user.id_docente,
          nome: user.nome,
          email: user.email
        });
      });
    } catch (error) {
      console.error('Signin error:', error.message);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  });

  router.post('/signout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Signout error:', err.message);
        return res.status(500).json({ error: 'Erro ao fazer logout' });
      }
      res.clearCookie('connect.sid', { path: '/' });
      res.json({ message: 'Logout realizado com sucesso' });
    });
  });

  return router;
}

