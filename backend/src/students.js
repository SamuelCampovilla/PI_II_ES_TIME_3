// ...existing code...
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

// garante que o aluno exista na tabela 'alunos'; se não existir, cria e retorna o registro
async function ensureAlunoExists(ra, nome) {
  if (!ra) throw new Error('RA inválido');

  const { data: existing, error: selectErr } = await supabase
    .from('alunos')
    .select('*')
    .eq('ra', ra)
    .maybeSingle();

  if (selectErr) {
    console.error('Erro ao buscar aluno:', selectErr);
    throw selectErr;
  }

  if (existing) return existing;

  const { data: inserted, error: insertErr } = await supabase
    .from('alunos')
    .insert([{ ra: ra, nome: nome }])
    .select()
    .maybeSingle();

  if (insertErr) {
    console.error('Erro ao inserir aluno:', insertErr);
    throw insertErr;
  }

  return inserted;
}

// matricula o aluno na turma se ainda não estiver matriculado
async function matricularAluno(ra, idTurma) {
  if (!ra || !idTurma) throw new Error('RA ou idTurma inválido');

  const { data: existingMat, error: matSelectErr } = await supabase
    .from('matricula')
    .select('*')
    .eq('ra_aluno', ra)
    .eq('id_turma', idTurma)
    .limit(1);

  if (matSelectErr) {
    console.error('Erro ao checar matrícula:', matSelectErr);
    throw matSelectErr;
  }

  if (existingMat && existingMat.length > 0) {
    return { already: true, data: existingMat[0] };
  }

  const { data: insertedMat, error: matInsertErr } = await supabase
    .from('matricula')
    .insert([{ ra_aluno: ra, id_turma: idTurma }])
    .select()
    .maybeSingle();

  if (matInsertErr) {
    console.error('Erro ao inserir matrícula:', matInsertErr);
    throw matInsertErr;
  }

  return { already: false, data: insertedMat };
}

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
    } else {
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
    }
  } catch (err) {
    console.error('Erro ao buscar alunos:', err);
    tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar alunos.</td></tr>';
  }

  // botão de adicionar aluno/matricular
  const btnAdicionar = document.getElementById('btnAdicionar');

  if (btnAdicionar) {
    btnAdicionar.addEventListener('click', async (evt) => {
      evt.preventDefault();
      const ra_aluno = (document.getElementById('ra_aluno')?.value || '').trim();
      const nome_aluno = (document.getElementById('nome_aluno')?.value || '').trim();

      if (!ra_aluno || !nome_aluno) {
        alert('Por favor, preencha todos os campos.');
        return;
      }

      try {
        // garante que o aluno exista (cria se necessário)
        const aluno = await ensureAlunoExists(ra_aluno, nome_aluno);
        console.log('Aluno garantido:', aluno);

        if (!idTurma) {
          alert('Turma não informada na URL.');
          return;
        }

        const resultadoMat = await matricularAluno(ra_aluno, idTurma);
        if (resultadoMat.already) {
          alert('Aluno já está matriculado nesta turma.');
        } else {
          alert('Aluno matriculado com sucesso.');
        }

        // recarrega lista
        window.location.reload();
      } catch (err) {
        console.error('Erro ao adicionar aluno/matricular:', err);
        alert('Ocorreu um erro. Veja o console para mais detalhes.');
      }
    });
  }
});
// ...existing code...