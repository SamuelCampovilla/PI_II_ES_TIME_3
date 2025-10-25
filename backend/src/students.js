// ...existing code...
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

// util: chunk array
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

// POST /import-students
// body: { id_turma: number|string, alunos: [{ ra: string, nome: string }, ...] }
app.post('/import-students', async (req, res) => {
  try {
    const { id_turma: idTurma, alunos } = req.body;
    if (!idTurma) return res.status(400).json({ error: 'id_turma is required' });
    if (!Array.isArray(alunos) || alunos.length === 0) {
      return res.status(400).json({ error: 'alunos array is required' });
    }

    // normalize and unique by RA
    const map = new Map();
    alunos.forEach(a => {
      const ra = (a.ra || '').toString().trim();
      const nome = (a.nome || '').toString().trim();
      if (ra && nome) map.set(ra, { ra, nome });
    });
    const unique = Array.from(map.values());
    if (unique.length === 0) return res.json({ imported: 0, matriculados: 0 });

    // 1) Upsert alunos in chunks
    const CHUNK = 200;
    for (const chunk of chunkArray(unique, CHUNK)) {
      const payload = chunk.map(r => ({ ra: r.ra, nome: r.nome }));
      const { error: upsertErr } = await supabase.from('alunos').upsert(payload, { onConflict: 'ra' });
      if (upsertErr) throw upsertErr;
    }

    // 2) Find existing matriculas for this turma
    const ras = unique.map(u => u.ra);
    const { data: existingMats, error: existingErr } = await supabase
      .from('matricula')
      .select('ra_aluno')
      .in('ra_aluno', ras)
      .eq('id_turma', Number(idTurma));

    if (existingErr) throw existingErr;
    const existSet = new Set((existingMats || []).map(m => m.ra_aluno));

    // 3) Insert missing matriculas
    const toInsert = unique
      .filter(u => !existSet.has(u.ra))
      .map(u => ({ ra_aluno: u.ra, id_turma: Number(idTurma) }));

    let insertedCount = 0;
    for (const chunk of chunkArray(toInsert, CHUNK)) {
      const { error: insertErr } = await supabase.from('matricula').insert(chunk);
      if (insertErr) throw insertErr;
      insertedCount += chunk.length;
    }

    return res.json({
      imported: unique.length,
      matriculados: insertedCount,
      message: 'Import completed'
    });
  } catch (err) {
    console.error('Import error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// simple health
app.get('/ping', (_req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`students backend running on port ${PORT}`));