const urlParams = new URLSearchParams(window.location.search);
const ID_TURMA = urlParams.get('id_turma') ? Number(urlParams.get('id_turma')) : 1;

let componentesAtuais = [];
let modoEditarComponentes = false;

// elementos da tabela
const tbody = document.getElementById('tbodyStudents');
const checkAll = document.getElementById('checkAll');
const switchEdicao = document.getElementById('switchEdicao');
const switchEditarComponentes = document.getElementById('switchEditarComponentes');
const wrapRemoverSelecionados = document.getElementById('wrapRemoverSelecionados');
const btnRemoverSelecionados = document.getElementById('btnRemoverSelecionados');
const thead = document.querySelector('#tabelaNotas thead');

// operações de salvamento
let _blockingOverlay = null;
function showBlockingOverlay(message = 'Salvando...') {
  if (_blockingOverlay) return;
  const ov = document.createElement('div');
  ov.id = 'blockingOverlay';
  ov.style.position = 'fixed';
  ov.style.inset = '0';
  ov.style.background = 'rgba(255,255,255,0.6)';
  ov.style.zIndex = '9999';
  ov.style.display = 'flex';
  ov.style.alignItems = 'center';
  ov.style.justifyContent = 'center';
  ov.style.pointerEvents = 'auto';

  const box = document.createElement('div');
  box.style.padding = '12px 18px';
  box.style.background = '#fff';
  box.style.border = '1px solid #ddd';
  box.style.borderRadius = '6px';
  box.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
  box.style.display = 'flex';
  box.style.gap = '10px';
  box.style.alignItems = 'center';

  const spinner = document.createElement('div');
  spinner.className = 'spinner-border text-primary';
  spinner.setAttribute('role', 'status');
  spinner.style.width = '1.5rem';
  spinner.style.height = '1.5rem';

  const txt = document.createElement('div');
  txt.textContent = message;
  txt.style.fontWeight = '600';

  box.appendChild(spinner);
  box.appendChild(txt);
  ov.appendChild(box);
  document.body.appendChild(ov);
  _blockingOverlay = ov;
}

function hideBlockingOverlay() {
  if (!_blockingOverlay) return;
  _blockingOverlay.remove();
  _blockingOverlay = null;
}

// modal adicionar aluno
const formAddAluno = document.getElementById('formAddAluno');
const addRa = document.getElementById('addRa');
const addNome = document.getElementById('addNome');

// modal criar componente
const formAddComponente = document.getElementById('formAddComponente');
const compNome = document.getElementById('compNome');
const compSigla = document.getElementById('compSigla');
const compDescricao = document.getElementById('compDescricao');

// ------------------------------------------------------
// helpers
// ------------------------------------------------------
function calcMedia(c1, c2, c3) {
  // Para o cálculo, NULL deve ser tratado como 0.
  // Porém, se ainda não existem 3 componentes, retornamos null para indicar pendência.
  if (componentesAtuais.length < 3) return null;

  const v1 = c1 == null ? 0 : Number(c1);
  const v2 = c2 == null ? 0 : Number(c2);
  const v3 = c3 == null ? 0 : Number(c3);

  const m = (v1 + v2 + v3) / 3;
  if (isNaN(m)) return null;
  return Number(m.toFixed(1));
}

function aplicarCorMedia(td, media) {
  td.classList.remove('grade-green', 'grade-red');
  if (media >= 7) td.classList.add('grade-green');
  else td.classList.add('grade-red');
}

function atualizarVisibilidadeRemoverSelecionados() {
  const anyChecked = tbody.querySelector('.row-check:checked');
  wrapRemoverSelecionados.classList.toggle('d-none', !anyChecked);
}

function formatNotaCell(valor) {
  return valor == null ? 'NULL' : valor;
}

function parseNotaTexto(texto) {
  const t = texto.trim().replace(',', '.');
  if (t === '' || t.toUpperCase() === 'NULL') return null;
  const n = Number(t);
  if (isNaN(n)) return null;
  return n;
}

// atualiza os cabeçalhos dos componentes (C1/C2/C3) com ou sem botão de remover
function renderComponentHeaders() {
  const ths = document.querySelectorAll('#tabelaNotas thead th');

  for (let i = 0; i < 3; i++) {
    const th = ths[3 + i];
    const componente = componentesAtuais[i];
    const label = componente?.sigla || `C${i + 1}`;

    if (modoEditarComponentes && componente) {
      th.innerHTML = `
        ${label}
        <button type="button"
                class="btn btn-sm btn-link text-danger p-0 ms-1 btn-remove-comp"
                data-comp-index="${i}">
          &times;
        </button>
      `;
    } else {
      th.textContent = label;
    }
  }

  ajustarColunasComponentes();
}

function ajustarColunasComponentes() {
  const ths = document.querySelectorAll('#tabelaNotas thead th');
  const rows = tbody.querySelectorAll('tr');

  for (let i = 0; i < 3; i++) {
    const visible = !!componentesAtuais[i];
    const th = ths[3 + i];
    if (th) th.style.display = visible ? '' : 'none';

    rows.forEach(tr => {
      const tds = tr.querySelectorAll('td');
      const td = tds[3 + i];
      if (td) td.style.display = visible ? '' : 'none';
    });
  }
}

// ------------------------------------------------------
// carregar dados do backend
// ------------------------------------------------------
async function carregarAlunos() {
  const res = await fetch(`/api/notas?id_turma=${ID_TURMA}`);
  const data = await res.json();

  const componentes = data.componentes || [];
  componentesAtuais = componentes;
  const alunos = data.alunos || [];

  // atualiza cabeçalho das 3 colunas de componente
  renderComponentHeaders();

  tbody.innerHTML = '';

  alunos.forEach(a => {
    const media = calcMedia(a.c1, a.c2, a.c3);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="row-check form-check-input" type="checkbox"></td>
      <td data-field="ra">${a.ra}</td>
      <td data-field="nome">${a.nome}</td>
      <td data-field="c1">${formatNotaCell(a.c1)}</td>
      <td data-field="c2">${formatNotaCell(a.c2)}</td>
      <td data-field="c3">${formatNotaCell(a.c3)}</td>
      <td data-field="media"></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger btn-remover">Remover</button>
      </td>
    `;

    const tdMedia = tr.querySelector('[data-field="media"]');

    if (componentesAtuais.length < 3) {
      // ainda não existem 3 componentes → não calcula média
      tdMedia.innerHTML = '<span class="dot-pending"></span>';
      tdMedia.classList.remove('grade-green', 'grade-red');
    } else {
      if (media === null) {
        tdMedia.textContent = 'NULL';
        tdMedia.classList.remove('grade-green', 'grade-red');
      } else {
        tdMedia.textContent = media.toFixed(1);
        aplicarCorMedia(tdMedia, media);
      }
    }

    tbody.appendChild(tr);
  });

  aplicarModoEdicaoNotas();
  aplicarModoEdicaoComponentes();
  atualizarVisibilidadeRemoverSelecionados();
}

// grava aluno + notas
async function salvarLinha(ra, nome, c1, c2, c3) {
  const body = { id_turma: ID_TURMA, ra, nome, c1, c2, c3 };
  const res = await fetch('/api/notas/salvarLinha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let errorText = '';
    try {
      const data = await res.json();
      if (data && data.message) errorText = data.message;
      else errorText = JSON.stringify(data);
    } catch (e) {
      try { errorText = await res.text(); } catch (_) { errorText = String(res.status); }
    }
    console.error('Erro ao salvar linha:', res.status, errorText);
    throw new Error(errorText || 'Erro ao salvar aluno/notas.');
  }

  await carregarAlunos();
  return true;
}

// remove aluno (matrícula + notas + cálculo_final)
async function removerAluno(ra) {
  if (!confirm(`Remover aluno ${ra} desta turma?`)) return;

  const res = await fetch(`/api/notas/${encodeURIComponent(ra)}?id_turma=${ID_TURMA}`, {
    method: 'DELETE'
  });

  if (res.status !== 204) {
    alert('Erro ao remover aluno.');
    console.error(await res.text());
    return;
  }

  await carregarAlunos();
}

// criar componente de nota
async function criarComponente(nome, sigla, descricao) {
  const body = { id_turma: ID_TURMA, nome, sigla, descricao };
  const res = await fetch('/api/componentes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let msg = 'Erro ao criar componente.';
    try {
      const data = await res.json();
      if (data.message) msg = data.message;
    } catch (e) {
      // se não vier JSON, ignora
    }
    alert(msg);
    return;
  }

  alert('Componente criado com sucesso!');
  await carregarAlunos();
}

// ------------------------------------------------------
// modos de edição
// ------------------------------------------------------
function aplicarModoEdicaoNotas() {
  const editable = switchEdicao.checked;

  tbody
    .querySelectorAll('[data-field="c1"], [data-field="c2"], [data-field="c3"]')
    .forEach(td => {
      td.contentEditable = editable ? 'true' : 'false';
      td.classList.toggle('editable', editable);
    });
}

function aplicarModoEdicaoComponentes() {
  modoEditarComponentes = switchEditarComponentes.checked;
  renderComponentHeaders();
}

// ------------------
// event listeners
// ------------------
// tenta montar os links do menu com o id do docente (usa /api/me se existir sessão, senão cai no fallback por email)
async function setupMenuDocenteLinks() {
  try {
    // 1) tenta obter via sessão (rota opcional /api/me)
    let idDoc = null;
    let email = null;
    try {
      const meRes = await fetch('/api/me');
      if (meRes.ok) {
        const me = await meRes.json();
        idDoc = me.id_docente;
        email = me.email;
      }
    } catch (e) {
      // ignore, vamos tentar fallback
    }

    // 2) fallback por email: procura na query string, localStorage ou cookie
    if (!idDoc) {
      const urlParams = new URLSearchParams(window.location.search);
      email = email || urlParams.get('email') || localStorage.getItem('user_email') || (document.cookie.match(/(?:^|; )email=([^;]*)/) || [])[1];
      if (email) {
        try {
          const r = await fetch(`/docente/id?email=${encodeURIComponent(email)}`);
          if (r.ok) {
            const j = await r.json();
            idDoc = j.id;
          }
        } catch (e) {
          console.error('Erro ao obter id do docente via fallback:', e);
        }
      }
    }

    if (!idDoc) return; // sem id, não atualiza links

    // atualiza links do dropdown (se existirem) adicionando id_docente
    const menuLinks = document.querySelectorAll('.dropdown-menu a');
    menuLinks.forEach(a => {
      if (!a || !a.getAttribute) return;
      const href = a.getAttribute('href') || '';
      if (href.includes('instituicao.html')) {
        a.setAttribute('href', `/frontend/pages/instituicao.html?id_docente=${encodeURIComponent(idDoc)}`);
      }
      if (href.includes('menagementPage.html')) {
        a.setAttribute('href', `/frontend/pages/menagementPage.html?id_docente=${encodeURIComponent(idDoc)}`);
      }
    });
  } catch (err) {
    console.error('Erro em setupMenuDocenteLinks:', err);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await setupMenuDocenteLinks();
  carregarAlunos();
});

// alternar edição de notas
switchEdicao.addEventListener('change', aplicarModoEdicaoNotas);

// alternar edição de componentes (mostrar/ocultar botões de excluir na sigla)
switchEditarComponentes.addEventListener('change', aplicarModoEdicaoComponentes);

checkAll.addEventListener('change', () => {
  const checks = tbody.querySelectorAll('.row-check');
  checks.forEach(chk => { chk.checked = checkAll.checked; });
  atualizarVisibilidadeRemoverSelecionados();
});

tbody.addEventListener('change', (e) => {
  if (e.target.classList.contains('row-check')) {
    atualizarVisibilidadeRemoverSelecionados();
  }
});

// edição inline das notas: commit apenas em blur ou Enter (para evitar múltiplas requisições a cada tecla)
tbody.addEventListener('keydown', (e) => {
  const td = e.target;
  const field = td.getAttribute && td.getAttribute('data-field');
  if (!['c1', 'c2', 'c3'].includes(field)) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    td.blur(); // dispara o handler de blur que faz o commit
  }
});

tbody.addEventListener('blur', async (e) => {
  const td = e.target;
  const field = td.getAttribute && td.getAttribute('data-field');
  if (!['c1', 'c2', 'c3'].includes(field)) return;

  // converte texto da célula em valor (ou null)
  const valor = parseNotaTexto(td.textContent);
  if (valor === null) {
    td.textContent = 'NULL';
  } else {
    td.textContent = valor.toFixed(1);
  }

  const tr = td.closest('tr');
  const c1Val = parseNotaTexto(tr.querySelector('[data-field="c1"]').textContent);
  const c2Val = parseNotaTexto(tr.querySelector('[data-field="c2"]').textContent);
  const c3Val = parseNotaTexto(tr.querySelector('[data-field="c3"]').textContent);

  const tdMedia = tr.querySelector('[data-field="media"]');

  // mostrar indicador de salvando
  const savingNode = document.createElement('span');
  savingNode.className = 'text-muted small ms-2';
  savingNode.textContent = 'Salvando...';
  td.appendChild(savingNode);

  // bloquear enquanto salva para evitar múltiplas ações
  showBlockingOverlay('Salvando nota...');

  try {
    await salvarLinha(
      tr.querySelector('[data-field="ra"]').textContent.trim(),
      tr.querySelector('[data-field="nome"]').textContent.trim(),
      c1Val, c2Val, c3Val
    );

    // recalcula média visual após salvar (o carregarAlunos também será chamado por salvarLinha)
    const media = calcMedia(c1Val, c2Val, c3Val);
    if (componentesAtuais.length < 3) {
      tdMedia.innerHTML = '<span class="dot-pending"></span>';
      tdMedia.classList.remove('grade-green', 'grade-red');
    } else {
      if (media === null) {
        tdMedia.textContent = 'NULL';
        tdMedia.classList.remove('grade-green', 'grade-red');
      } else {
        tdMedia.textContent = media.toFixed(1);
        aplicarCorMedia(tdMedia, media);
      }
    }
    const okNode = document.createElement('span');
    okNode.className = 'text-success small ms-2';
    okNode.textContent = 'Salvo';
    tdMedia.appendChild(okNode);
    setTimeout(() => { if (okNode && okNode.parentNode) okNode.parentNode.removeChild(okNode); }, 1500);
  } catch (err) {
    console.error('Erro ao salvar nota (blur):', err);
    const errorNode = document.createElement('div');
    errorNode.className = 'text-danger small mt-1';
    errorNode.textContent = err.message || 'Erro ao salvar nota.';
    tdMedia.appendChild(errorNode);
    setTimeout(() => { if (errorNode && errorNode.parentNode) errorNode.parentNode.removeChild(errorNode); }, 5000);
  } finally {
    if (savingNode && savingNode.parentNode) savingNode.parentNode.removeChild(savingNode);
    // desbloquear
    hideBlockingOverlay();
  }
}, true);

// remover único
tbody.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-remover')) {
    const tr = e.target.closest('tr');
    const ra = tr.querySelector('[data-field="ra"]').textContent.trim();
    removerAluno(ra);
  }
});

// remover selecionados
btnRemoverSelecionados.addEventListener('click', async () => {
  const selecionados = Array.from(tbody.querySelectorAll('.row-check:checked'));
  if (!selecionados.length) return;

  if (!confirm(`Remover ${selecionados.length} aluno(s) desta turma?`)) return;

  // delete em lote sem confirmar um a um
  for (const chk of selecionados) {
    const tr = chk.closest('tr');
    const ra = tr.querySelector('[data-field="ra"]').textContent.trim();
    try {
      const res = await fetch(`/api/notas/${encodeURIComponent(ra)}?id_turma=${ID_TURMA}`, { method: 'DELETE' });
      if (res.status !== 204) {
        const text = await res.text();
        console.error('Erro ao remover aluno', ra, res.status, text);
        // mostrar erro no lugar da linha
        const errNode = document.createElement('div');
        errNode.className = 'text-danger small';
        errNode.textContent = `Erro ao remover ${ra}: ${text || res.status}`;
        tr.querySelector('td:last-child').appendChild(errNode);
      }
    } catch (err) {
      console.error('Erro ao remover aluno:', err);
    }
  }

  await carregarAlunos();
});

// adicionar aluno
formAddAluno.addEventListener('submit', async (e) => {
  e.preventDefault();

  const ra = addRa.value.trim();
  const nome = addNome.value.trim();

  if (!ra || !nome) {
    alert('RA e nome são obrigatórios.');
    return;
  }

  // na criação do aluno, ainda não lançamos notas
  showBlockingOverlay('Adicionando aluno...');
  try {
    await salvarLinha(ra, nome, null, null, null);
  } finally {
    hideBlockingOverlay();
  }

  formAddAluno.reset();
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalAddAluno'));
  modal.hide();
});

// submit criar componente
formAddComponente.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = compNome.value.trim();
  const sigla = compSigla.value.trim();
  const descricao = compDescricao.value.trim();

  if (!nome || !sigla) {
    alert('Nome e sigla são obrigatórios.');
    return;
  }

  // mostrar overlay de processamento
  showBlockingOverlay('Criando componente...');
  try {
    await criarComponente(nome, sigla, descricao);
  } finally {
    hideBlockingOverlay();
  }

  formAddComponente.reset();
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalAddComponente'));
  modal.hide();
});

// ---------------------------
// remoção de componentes 
// ---------------------------
async function removerComponente(id) {
  // mostrar overlay de processamento
  showBlockingOverlay('Removendo componente...');
  try {
    const res = await fetch(`/api/componentes/${id}`, { method: 'DELETE' });

    if (res.status !== 204) {
      let msg = 'Erro ao remover componente.';
      try {
        const data = await res.json();
        if (data.message) msg = data.message;
      } catch (e) {
        // pode não ter body
      }
      alert(msg);
      return;
    }

    await carregarAlunos();
  } finally {
    hideBlockingOverlay();
  }
}

thead.addEventListener('click', async (e) => {
  if (!modoEditarComponentes) return; // só pode remover com switch ligado

  const btn = e.target.closest('.btn-remove-comp');
  if (!btn) return;

  const compIndex = Number(btn.dataset.compIndex);
  const componente = componentesAtuais[compIndex];
  if (!componente) return;

  const ok = confirm(`Remover componente ${componente.sigla}? Todas as notas desse componente serão apagadas.`);
  if (!ok) return;

  await removerComponente(componente.id_componente);
});