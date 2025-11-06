import express from 'express';
import { pool } from '../db/pool.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// GET /api/docente/:id - Get docente by ID
router.get('/docente/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT id_docente, nome, email, telefone FROM docente WHERE id_docente = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Docente não encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar docente:', error.message);
    res.status(500).json({ error: 'Erro ao buscar docente' });
  }
});

// GET /api/docente/:id/instituicoes - Get institutions for a docente
router.get('/docente/:id/instituicoes', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT i.id_instituicao, i.nome_instituicao 
       FROM instituicao i
       INNER JOIN docente_instituicao di ON i.id_instituicao = di.id_instituicao
       WHERE di.id_docente = ?`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar instituições:', error.message);
    res.status(500).json({ error: 'Erro ao buscar instituições' });
  }
});

// GET /api/instituicoes/:id/cursos - Get courses count for institution
router.get('/instituicoes/:id/cursos', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM cursos WHERE id_instituicao = ?',
      [id]
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Erro ao buscar cursos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar cursos' });
  }
});

// POST /api/instituicoes - Create institution
router.post('/instituicoes', requireAuth, async (req, res) => {
  try {
    const { nome_instituicao } = req.body;
    if (!nome_instituicao || !nome_instituicao.trim()) {
      return res.status(400).json({ error: 'Nome da instituição é obrigatório' });
    }

    // Check if institution exists
    const [existing] = await pool.execute(
      'SELECT id_instituicao FROM instituicao WHERE nome_instituicao = ?',
      [nome_instituicao.trim()]
    );

    let idInstituicao;
    if (existing.length > 0) {
      idInstituicao = existing[0].id_instituicao;
    } else {
      // Create new institution
      const [result] = await pool.execute(
        'INSERT INTO instituicao (nome_instituicao) VALUES (?)',
        [nome_instituicao.trim()]
      );
      idInstituicao = result.insertId;
    }

    res.json({ id_instituicao, nome_instituicao: nome_instituicao.trim() });
  } catch (error) {
    console.error('Erro ao criar instituição:', error.message);
    res.status(500).json({ error: 'Erro ao criar instituição' });
  }
});

// POST /api/docente/:idDocente/instituicoes/:idInstituicao - Link docente to institution
router.post('/docente/:idDocente/instituicoes/:idInstituicao', requireAuth, async (req, res) => {
  try {
    const { idDocente, idInstituicao } = req.params;

    // Check if link already exists
    const [existing] = await pool.execute(
      'SELECT 1 FROM docente_instituicao WHERE id_docente = ? AND id_instituicao = ?',
      [idDocente, idInstituicao]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Vínculo já existe' });
    }

    await pool.execute(
      'INSERT INTO docente_instituicao (id_docente, id_instituicao) VALUES (?, ?)',
      [idDocente, idInstituicao]
    );

    res.json({ message: 'Vínculo criado com sucesso' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Vínculo já existe' });
    }
    console.error('Erro ao criar vínculo:', error.message);
    res.status(500).json({ error: 'Erro ao criar vínculo' });
  }
});

// DELETE /api/docente/:idDocente/instituicoes/:idInstituicao - Unlink docente from institution
router.delete('/docente/:idDocente/instituicoes/:idInstituicao', requireAuth, async (req, res) => {
  try {
    const { idDocente, idInstituicao } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM docente_instituicao WHERE id_docente = ? AND id_instituicao = ?',
      [idDocente, idInstituicao]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    res.json({ message: 'Vínculo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover vínculo:', error.message);
    res.status(500).json({ error: 'Erro ao remover vínculo' });
  }
});

// POST /api/docente/:idDocente/instituicoes - Add institution to docente (creates if needed)
router.post('/docente/:idDocente/instituicoes', requireAuth, async (req, res) => {
  try {
    const { idDocente } = req.params;
    const { nome_instituicao } = req.body;

    if (!nome_instituicao || !nome_instituicao.trim()) {
      return res.status(400).json({ error: 'Nome da instituição é obrigatório' });
    }

    // Check if institution exists
    const [existing] = await pool.execute(
      'SELECT id_instituicao FROM instituicao WHERE nome_instituicao = ?',
      [nome_instituicao.trim()]
    );

    let idInstituicao;
    if (existing.length > 0) {
      idInstituicao = existing[0].id_instituicao;
    } else {
      // Create new institution
      const [result] = await pool.execute(
        'INSERT INTO instituicao (nome_instituicao) VALUES (?)',
        [nome_instituicao.trim()]
      );
      idInstituicao = result.insertId;
    }

    // Check if link already exists
    const [linkExists] = await pool.execute(
      'SELECT 1 FROM docente_instituicao WHERE id_docente = ? AND id_instituicao = ?',
      [idDocente, idInstituicao]
    );

    if (linkExists.length === 0) {
      // Create link
      await pool.execute(
        'INSERT INTO docente_instituicao (id_docente, id_instituicao) VALUES (?, ?)',
        [idDocente, idInstituicao]
      );
    }

    res.json({ 
      id_instituicao: idInstituicao, 
      nome_instituicao: nome_instituicao.trim(),
      message: 'Vínculo criado com sucesso' 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Vínculo já existe' });
    }
    console.error('Erro ao adicionar instituição:', error.message);
    res.status(500).json({ error: 'Erro ao adicionar instituição' });
  }
});

export default router;

