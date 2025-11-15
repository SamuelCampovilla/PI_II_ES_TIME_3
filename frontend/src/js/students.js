let urlParams = new URLSearchParams(window.location.search);
let ID_TURMA = urlParams.get('turmaId') ? Number(urlParams.get('turmaId')) : 1;


function setTurma(novoId) {
  TURMA_ID = Number(novoId) || TURMA_ID;
  console.log('Turma alterada para:', TURMA_ID);
  carregarAlunos();
}

let listaComponentes = [];
let listaAlunos = [];
let modoComponentes = false;

//-----------------------------------------------------------------------------------------------------------------------------
// variaveis para a pagina de alunos

const corpoTabela = document.getElementById('tbodyStudents');
const checkAll = document.getElementById('checkAll');
const switchEdicao = document.getElementById('switchEdicao');
const switchEditarComponentes = document.getElementById('switchEditarComponentes');
const caixaRemocoes = document.getElementById('caixaRemocoes');
const btnRemoverMarcados = document.getElementById('btnRemoverMarcados');
const thead = document.querySelector('#tabelaNotas thead');
const btnImportarCsv = document.getElementById('btnImportarCsv');
const btnExportarCsv = document.getElementById('btnExportarCsv');
const inputCsvAlunos = document.getElementById('inputCsvAlunos');
const nomeTurmaSelecionada = document.getElementById('nomeTurmaSelecionada');
const institutionId = urlParams.get('instituicaoId');
const docenteEmail = urlParams.get('email');

// modal adicionar aluno
const formAddAluno = document.getElementById('formAddAluno');
const addRa = document.getElementById('addRa');
const addNome = document.getElementById('addNome');

// modal criar componente
const formAddComponente = document.getElementById('formAddComponente');
const compNome = document.getElementById('compNome');
const compSigla = document.getElementById('compSigla');
const compDescricao = document.getElementById('compDescricao');




// ----------------------------------------------------------------------------------------------------------------
// botao para voltar -- Caio Polo

const voltar = document.getElementById('voltarParaCursos');
voltar.addEventListener('click', ()=>{
  window.location.href = `/frontend/pages/menagementPage.html?institutionId=${institutionId}&email=${docenteEmail}`;
})



// ------------------------------------------------------------------------------------------------------------------
// funcao para media de notas

function mediaNotas(c1, c2, c3) {
  if (listaComponentes.length < 3) return null;

  const v1 = c1 == null ? 0 : Number(c1);
  const v2 = c2 == null ? 0 : Number(c2);
  const v3 = c3 == null ? 0 : Number(c3);

  const m = (v1 + v2 + v3) / 3;
  if (isNaN(m)) return null;
  const rounded = Math.round(m * 2) / 2;
  return Number(rounded.toFixed(1));
}



function atualizaBotaoRemover() {
  const anyChecked = corpoTabela.querySelector('.row-check:checked');
  caixaRemocoes.classList.toggle('d-none', !anyChecked);
}

function mostrarNota(valor) {
  return valor == null ? 'NULL' : valor;
}

function lerNota(texto) {
  const t = texto.trim().replace(',', '.');
  if (t === '' || t.toUpperCase() === 'NULL') return null;
  const n = Number(t);
  if (isNaN(n)) return null;
  return n;
}

function quebrarLinhaCsv(linha) {
  const trimmed = linha.trim();
  if (!trimmed) return [];

  const separadores = [';', ','];
  for (const sep of separadores) {
    const partes = trimmed.split(sep);
    if (partes.length >= 2) {
      return partes.map(part => part.trim());
    }
  }

  return [trimmed];
}

function pareceCabecalho(idColuna, nomeColuna) {
  const id = (idColuna || '').toLowerCase();
  const nome = (nomeColuna || '').toLowerCase();
  const possiveisIds = ['ra', 'id', 'identificador', 'matricula'];
  const possiveisNomes = ['nome', 'nome completo', 'aluno', 'estudante'];
  return possiveisIds.includes(id) || possiveisNomes.includes(nome);
}

async function montarListaCsv(file) {
  const texto = await file.text();
  const linhas = texto
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length);

  const alunos = [];

  linhas.forEach((linha, index) => {
    const partes = quebrarLinhaCsv(linha);
    if (partes.length < 2) return;

    const ra = partes[0]?.trim();
    const nome = partes[1]?.trim();

    if (!ra || !nome) return;
    if (index === 0 && pareceCabecalho(ra, nome)) return;

    alunos.push({ ra, nome });
  });

  return alunos;
}

function desenharCabecalho() {
  const ths = document.querySelectorAll('#tabelaNotas thead th');

  for (let i = 0; i < 3; i++) {
    const th = ths[3 + i];
    const componente = listaComponentes[i];
    const label = componente?.sigla || `C${i + 1}`;

    if (modoComponentes && componente) {
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

  arrumarColunas();
}

function arrumarColunas() {
  const ths = document.querySelectorAll('#tabelaNotas thead th');
  const rows = corpoTabela.querySelectorAll('tr');

  for (let i = 0; i < 3; i++) {
    const visible = !!listaComponentes[i];
    const th = ths[3 + i];
    if (th) th.style.display = visible ? '' : 'none';

    rows.forEach(tr => {
      const tds = tr.querySelectorAll('td');
      const td = tds[3 + i];
      if (td) td.style.display = visible ? '' : 'none';
    });
  }
}


async function carregarTela() {
  const res = await fetch(`/notas?id_turma=${ID_TURMA}`);
  const data = await res.json();
  const componentes = data.componentes || [];
  listaComponentes = componentes;
  const alunos = data.alunos || [];
  listaAlunos = alunos;
  const nomeTurma = data.nome_turma;

  if (nomeTurmaSelecionada) {
    nomeTurmaSelecionada.textContent = nomeTurma || `Turma ${ID_TURMA}`;
  }

  desenharCabecalho();
  corpoTabela.innerHTML = '';

  alunos.forEach(a => {
    const media = mediaNotas(a.c1, a.c2, a.c3);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="row-check form-check-input" type="checkbox"></td>
      <td data-field="ra">${a.ra}</td>
      <td data-field="nome">${a.nome}</td>
      <td data-field="c1">${mostrarNota(a.c1)}</td>
      <td data-field="c2">${mostrarNota(a.c2)}</td>
      <td data-field="c3">${mostrarNota(a.c3)}</td>
      <td data-field="media"></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger btn-remover">Remover</button>
      </td>
    `;

    const tdMedia = tr.querySelector('[data-field="media"]');

    if (listaComponentes.length < 3) {
      tdMedia.innerHTML = '<span class="dot-pending"></span>';
      tdMedia.classList.remove('grade-green', 'grade-red');
    } else {
      if (media === null) {
        tdMedia.textContent = 'NULL';
        tdMedia.classList.remove('grade-green', 'grade-red');
      } else {
        tdMedia.textContent = media.toFixed(1);
    
      }
    }

    corpoTabela.appendChild(tr);
  });

  alternarNotas();
  alternarComponentes();
  atualizaBotaoRemover();
}

async function guardarAluno(ra, nome, c1, c2, c3, { recarregar = true } = {}) {
  const body = { id_turma: ID_TURMA, ra, nome, c1, c2, c3 };
  const res = await fetch('/notas/salvarLinha', {
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

  if (recarregar) {
    await carregarTela();
  }
  return true;
}

async function importarCsv(file) {
  const registros = await montarListaCsv(file);
  if (!registros.length) {
    alert('Não encontramos alunos válidos no CSV informado.');
    return;
  }

  const idsExistentes = new Set(listaAlunos.map(a => String(a.ra).trim()));
  const idsNovos = new Set();
  const novosAlunos = [];
  let duplicados = 0;

  registros.forEach(reg => {
    const idLimpo = reg.ra.trim();
    const nomeLimpo = reg.nome.trim();
    if (!idLimpo || !nomeLimpo) return;

    if (idsExistentes.has(idLimpo) || idsNovos.has(idLimpo)) {
      duplicados++;
      return;
    }

    idsNovos.add(idLimpo);
    novosAlunos.push({ ra: idLimpo, nome: nomeLimpo });
  });

  if (!novosAlunos.length) {
    alert('Todos os alunos do CSV já existem nesta turma.');
    return;
  }

  let inseridos = 0;

  try {
    for (const aluno of novosAlunos) {
      await guardarAluno(aluno.ra, aluno.nome, null, null, null, { recarregar: false });
      inseridos++;
    }
    await carregarTela();
    alert(`Importação concluída!\nNovos alunos: ${inseridos}\nIgnorados por duplicidade: ${duplicados}`);
  } catch (err) {
    console.error('Erro durante importação CSV:', err);
    alert('Erro ao importar alunos. Verifique o arquivo e tente novamente.');
  }
}

function baixarCsv() {
  if (!listaAlunos.length) {
    alert('Não há alunos nesta turma para exportar.');
    return;
  }

  const todosComNotas = listaAlunos.length > 0 && listaComponentes.length >= 3 && listaAlunos.every(aluno => {
    const notas = [aluno.c1, aluno.c2, aluno.c3];
    if (notas.some(n => n == null || n === '' || n === '-')) return false;
    const media = mediaNotas(aluno.c1, aluno.c2, aluno.c3);
    return media !== null;
  });

  if (!todosComNotas) {
    alert('Para exportar é necessário que todos os alunos tenham as notas dos componentes e o cálculo final concluído.');
    return;
  }

  const linhas = ['ra,nome'];
  listaAlunos.forEach(aluno => {
    const ra = (aluno.ra ?? '').toString().trim();
    const nome = (aluno.nome ?? '').toString().trim();
    linhas.push(`${ra},"${nome.replace(/"/g, '""')}"`);
  });

  const csvString = linhas.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const agora = new Date();
  const pad = (num, size = 2) => String(num).padStart(size, '0');
  const dataStr = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}_${pad(agora.getHours())}${pad(agora.getMinutes())}${pad(agora.getSeconds())}${pad(agora.getMilliseconds(), 3)}`;
  const turmaStr = `Turma${ID_TURMA}`;
  const siglaStr = listaComponentes[0]?.sigla ? listaComponentes[0].sigla : 'SemSigla';
  const nomeArquivo = `${dataStr}-${turmaStr}-${siglaStr}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// remove aluno
async function apagarAluno(ra) {
  if (!confirm(`Remover aluno ${ra} desta turma?`)) return;

  const res = await fetch(`/notas/${encodeURIComponent(ra)}?id_turma=${ID_TURMA}`, {
    method: 'DELETE'
  });

  if (res.status !== 204) {
    alert('Erro ao remover aluno.');
    console.error(await res.text());
    return;
  }

  await carregarTela();
}

// criar componente de nota
async function guardarComponente(nome, sigla, descricao) {
  const body = { id_turma: ID_TURMA, nome, sigla, descricao };
  const res = await fetch('/componentes', {
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
    }
    alert(msg);
    return;
  }

  alert('Componente criado com sucesso!');
  await carregarTela();
}

function alternarNotas() {
  const editable = switchEdicao.checked;

  corpoTabela
    .querySelectorAll('[data-field="c1"], [data-field="c2"], [data-field="c3"]')
    .forEach(td => {
      td.contentEditable = editable ? 'true' : 'false';
      td.classList.toggle('editable', editable);
    });
}

function alternarComponentes() {
  modoComponentes = switchEditarComponentes.checked;
  desenharCabecalho();
}

async function carregarLinksMenu() {
  try {
    let idDoc = null;
    let email = null;
    try {
      const meRes = await fetch('/me');
      if (meRes.ok) {
        const me = await meRes.json();
        idDoc = me.id_docente;
        email = me.email;
      }
    } catch (e) {
    }

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

    if (!idDoc) return;
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
    console.error('Erro em carregarLinksMenu:', err);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await carregarLinksMenu();
  carregarTela();
});

switchEdicao.addEventListener('change', alternarNotas);

switchEditarComponentes.addEventListener('change', alternarComponentes);

checkAll.addEventListener('change', () => {
  const checks = corpoTabela.querySelectorAll('.row-check');
  checks.forEach(chk => { chk.checked = checkAll.checked; });
  atualizaBotaoRemover();
});

corpoTabela.addEventListener('change', (e) => {
  if (e.target.classList.contains('row-check')) {
    atualizaBotaoRemover();
  }
});

corpoTabela.addEventListener('keydown', (e) => {
  const td = e.target;
  const field = td.getAttribute && td.getAttribute('data-field');
  if (!['c1', 'c2', 'c3'].includes(field)) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    td.blur();
  }
});

corpoTabela.addEventListener('blur', async (e) => {
  const td = e.target;
  const field = td.getAttribute && td.getAttribute('data-field');
  if (!['c1', 'c2', 'c3'].includes(field)) return;

  const valor = lerNota(td.textContent);
  if (valor === null) {
    td.textContent = 'NULL';
  } else {
    td.textContent = valor.toFixed(1);
  }

  const tr = td.closest('tr');
  const c1Val = lerNota(tr.querySelector('[data-field="c1"]').textContent);
  const c2Val = lerNota(tr.querySelector('[data-field="c2"]').textContent);
  const c3Val = lerNota(tr.querySelector('[data-field="c3"]').textContent);

  const tdMedia = tr.querySelector('[data-field="media"]');

  const savingNode = document.createElement('span');
  savingNode.className = 'text-muted small ms-2';
  savingNode.textContent = 'Salvando...';
  td.appendChild(savingNode);

  try {
    await guardarAluno(
      tr.querySelector('[data-field="ra"]').textContent.trim(),
      tr.querySelector('[data-field="nome"]').textContent.trim(),
      c1Val, c2Val, c3Val
    );

    const media = mediaNotas(c1Val, c2Val, c3Val);
    if (listaComponentes.length < 3) {
      tdMedia.innerHTML = '<span class="dot-pending"></span>';
      tdMedia.classList.remove('grade-green', 'grade-red');
    } else {
      if (media === null) {
        tdMedia.textContent = 'NULL';
        tdMedia.classList.remove('grade-green', 'grade-red');
      } else {
        tdMedia.textContent = media.toFixed(1);
      
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
  }
}, true);

corpoTabela.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-remover')) {
    const tr = e.target.closest('tr');
    const ra = tr.querySelector('[data-field="ra"]').textContent.trim();
    apagarAluno(ra);
  }
});

// remover selecionados
btnRemoverMarcados.addEventListener('click', async () => {
  const selecionados = Array.from(corpoTabela.querySelectorAll('.row-check:checked'));
  if (!selecionados.length) return;

  if (!confirm(`Remover ${selecionados.length} aluno(s) desta turma?`)) return;

  for (const chk of selecionados) {
    const tr = chk.closest('tr');
    const ra = tr.querySelector('[data-field="ra"]').textContent.trim();
    try {
      const res = await fetch(`/notas/${encodeURIComponent(ra)}?id_turma=${ID_TURMA}`, { method: 'DELETE' });
      if (res.status !== 204) {
        const text = await res.text();
        console.error('Erro ao remover aluno', ra, res.status, text);
        const errNode = document.createElement('div');
        errNode.className = 'text-danger small';
        errNode.textContent = `Erro ao remover ${ra}: ${text || res.status}`;
        tr.querySelector('td:last-child').appendChild(errNode);
      }
    } catch (err) {
      console.error('Erro ao remover aluno:', err);
    }
  }

  await carregarTela();
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

  try{
        
        await guardarAluno(ra, nome, null, null, null, { recarregar: false }); 
        formAddAluno.reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAddAluno'));
        if(modal){
          modal.hide();
        }
        await carregarTela(); 
    }catch(error){
        console.error("Falha ao adicionar aluno:", error);
    }
});
 

formAddComponente.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = compNome.value.trim();
  const sigla = compSigla.value.trim();
  const descricao = compDescricao.value.trim();

  if (!nome || !sigla) {
    alert('Nome e sigla são obrigatórios.');
    return;
  }

  await guardarComponente(nome, sigla, descricao);

  formAddComponente.reset();
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalAddComponente'));
  modal.hide();
});

if (btnImportarCsv && inputCsvAlunos) {
  btnImportarCsv.addEventListener('click', () => inputCsvAlunos.click());
  inputCsvAlunos.addEventListener('change', async (e) => {
    const [file] = e.target.files;
    if (file) {
      await importarCsv(file);
    }
    e.target.value = '';
  });
}

if (btnExportarCsv) {
  btnExportarCsv.addEventListener('click', baixarCsv);
}

async function apagarComponente(id) {
  const res = await fetch(`/componentes/${id}`, { method: 'DELETE' });

  await carregarTela();
}

thead.addEventListener('click', async (e) => {
  if (!modoComponentes) return;

  const btn = e.target.closest('.btn-remove-comp');
  if (!btn) return;

  const compIndex = Number(btn.dataset.compIndex);
  const componente = listaComponentes[compIndex];
  if (!componente) return;

  const ok = confirm(`Remover componente ${componente.sigla}? Todas as notas desse componente serão apagadas.`);
  if (!ok) return;

  await apagarComponente(componente.id_componente);
});
