// ...existing code...
import Papa from 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm';

document.addEventListener('DOMContentLoaded', () => {
  // Elements (creates modal markup if not present)
  const btnImportar = document.getElementById('btnImportar');
  let importBg = document.getElementById('import-blurred-bg');
  let importPop = document.getElementById('import-pop-up');

  if (!importBg) {
    importBg = document.createElement('div');
    importBg.id = 'import-blurred-bg';
    importBg.className = 'hidden';
    document.body.appendChild(importBg);
  }
  if (!importPop) {
    importPop = document.createElement('div');
    importPop.id = 'import-pop-up';
    importPop.setAttribute('role', 'dialog');
    importPop.setAttribute('aria-modal', 'true');
    importBg.appendChild(importPop);
  }

  // populate pop-up content (if empty)
  if (!importPop.innerHTML.trim()) {
    importPop.innerHTML = `
      <button id="import-close" aria-label="Fechar">✕</button>
      <h2>Importar CSV de Alunos</h2>
      <p>O CSV deve conter colunas RA e Nome (ex.: ra,nome)</p>
      <input type="file" id="csvFileInput" accept=".csv,text/csv">
      <div style="margin-top:10px;">
        <button id="btnStartImport">Enviar e Importar</button>
        <button id="btnCancelImport">Cancelar</button>
      </div>
      <div id="import-status" style="margin-top:8px;color:#333"></div>
    `;
  }

  const importClose = document.getElementById('import-close') || importPop.querySelector('#import-close');
  const btnCancelImport = document.getElementById('btnCancelImport') || importPop.querySelector('#btnCancelImport');
  const csvFileInput = document.getElementById('csvFileInput') || importPop.querySelector('#csvFileInput');
  const btnStartImport = document.getElementById('btnStartImport') || importPop.querySelector('#btnStartImport');
  const importStatus = document.getElementById('import-status') || importPop.querySelector('#import-status');

  function openImportModal() {
    importBg.classList.remove('hidden');
    importBg.setAttribute('aria-hidden', 'false');
    importStatus.textContent = '';
    if (csvFileInput) csvFileInput.value = '';
  }
  function closeImportModal() {
    importBg.classList.add('hidden');
    importBg.setAttribute('aria-hidden', 'true');
  }

  // open modal
  btnImportar?.addEventListener('click', (e) => {
    e.preventDefault();
    openImportModal();
  });

  importClose?.addEventListener('click', () => closeImportModal());
  btnCancelImport?.addEventListener('click', () => closeImportModal());
  importBg.addEventListener('click', (ev) => {
    if (ev.target === importBg) closeImportModal();
  });

  // helper: map row keys case-insensitive
  function normalizeRow(row) {
    const normalized = {};
    for (const k of Object.keys(row)) {
      normalized[k.trim().toLowerCase()] = row[k];
    }
    return normalized;
  }

  // send to backend
  async function postImportPayload(idTurma, alunos) {
    const endpoint = '/import-students'; // backend URL (adjust if different or include port)
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_turma: idTurma, alunos })
    });
    return resp.json();
  }

  btnStartImport?.addEventListener('click', async (evt) => {
    evt.preventDefault();
    if (!csvFileInput.files || csvFileInput.files.length === 0) {
      importStatus.textContent = 'Selecione um arquivo CSV.';
      return;
    }
    // get id_turma from URL
    const params = new URLSearchParams(window.location.search);
    const idTurma = params.get('id_turma');
    if (!idTurma) {
      importStatus.textContent = 'id_turma não informado na URL (use ?id_turma=...).';
      return;
    }

    const file = csvFileInput.files[0];
    importStatus.textContent = 'Lendo arquivo...';
    try {
      const parsed = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => resolve(res),
          error: (err) => reject(err)
        });
      });

      if (!parsed || !parsed.data || parsed.data.length === 0) {
        importStatus.textContent = 'Arquivo vazio ou formato inválido.';
        return;
      }

      // normalize and map to {ra, nome}
      const rows = parsed.data.map(r => normalizeRow(r)).map(r => {
        const ra = (r.ra || r['matricula'] || r['registration'] || '').toString().trim();
        const nome = (r.nome || r['name'] || r['aluno'] || '').toString().trim();
        return { ra, nome };
      }).filter(x => x.ra && x.nome);

      if (rows.length === 0) {
        importStatus.textContent = 'Nenhuma linha válida com RA e Nome encontrada.';
        return;
      }

      importStatus.textContent = `Enviando ${rows.length} registros para importação...`;
      btnStartImport.disabled = true;

      // POST to backend
      const result = await postImportPayload(idTurma, rows);
      if (result.error) {
        importStatus.textContent = `Erro: ${result.error}`;
      } else {
        importStatus.textContent = `Importado: ${result.imported || 0}, Matriculados: ${result.matriculados || 0}`;
        setTimeout(() => location.reload(), 800);
      }
    } catch (err) {
      console.error(err);
      importStatus.textContent = 'Erro ao processar arquivo: ' + (err.message || err);
    } finally {
      btnStartImport.disabled = false;
    }
  });
});