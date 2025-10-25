
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

// popula a tabela do HTML (Matrícula, Nome, P1, P2, P3, Nota Final, Nota Final Ajustada)
document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.querySelector('.table-container table tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

  const params = new URLSearchParams(window.location.search);
  const idTurma = params.get('id_turma');

  try {
    let query = supabase
      .from('matricula')
      .select(`
        ra_aluno,
        componente_1,
        componente_2,
        componente_3,
        nota_final,
        nota_final_ajustada,
        alunos ( ra, nome )
      `);

    if (idTurma) query = query.eq('id_turma', idTurma);

    const { data: rows, error } = await query;
    if (error) throw error;

    if (!rows || rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">Nenhum aluno matriculado.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    rows.forEach(r => {
      const ra = r.ra_aluno ?? (r.alunos && r.alunos.ra) ?? '—';
      const nome = (r.alunos && r.alunos.nome) ?? '—';
      const p1 = r.componente_1 ?? '—';
      const p2 = r.componente_2 ?? '—';
      const p3 = r.componente_3 ?? '—';
      const notaFinal = r.nota_final ?? '—';
      const notaAjust = r.nota_final_ajustada ?? '—';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ra}</td>
        <td>${nome}</td>
        <td>${p1}</td>
        <td>${p2}</td>
        <td>${p3}</td>
        <td class="${notaFinal !== '—' && notaFinal >= 6 ? 'green' : (notaFinal !== '—' ? 'red' : '')}">${notaFinal}</td>
        <td>${notaAjust}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erro ao buscar alunos:', err);
    tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar alunos.</td></tr>';
  }
});
