import { exclusion_modal } from './exclusion_modal.js';

document.addEventListener('DOMContentLoaded', async () => {

//------------------------------------------------------------------------------------------------------------------
// variaveis

    const botaoAbrir = document.getElementById('add-course');
    const fundoBlur = document.getElementById('blurred-bg');
    const popupConteudo = document.getElementById('pop-up');
    const popupDisciplina = document.getElementById('pop-up-disciplina');
    const popupTurma = document.getElementById('pop-up-turma'); 
    const addButton = document.getElementById('btnAdicionar');
    const addDisciplina = document.getElementById('btnAdicionarDisciplina');
    const addTurma = document.getElementById('btnAdicionarTurma');   
    const listaCursosContainer = document.getElementById('lista_cursos');

    const urlParams = new URLSearchParams(window.location.search);
    const institutionId = urlParams.get('institutionId');

    // Inicializa o modal de exclusão
    exclusion_modal();
    const docenteEmail = urlParams.get('email');
//------------------------------------------------------------------------------------------------------------------
// busca por cursos cadastrados na instituição

    if (institutionId) {
        try {
            const response = await fetch(`/institution/${institutionId}`);
            if (response.ok) {
                const institution = await response.json();
                const institutionNameElement = document.getElementById('nome_instituicao');
                if (institutionNameElement) institutionNameElement.textContent = institution.nome_instituicao;
            } else {
                console.error('Erro ao buscar dados da instituição');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
        }
        loadCoursesForInstitution(institutionId);
    } else {
        if (listaCursosContainer) listaCursosContainer.innerHTML = '<p>ID da instituição não fornecido na URL.</p>';
    }

    // --- DELEGAÇÃO DE EVENTOS PARA AÇÕES ---
    listaCursosContainer.addEventListener('click', async (e) => {
        const addDiscBtn = e.target.closest('.btn-add-disciplina');
        const delDiscBtn = e.target.closest('.btn-delete-disciplina');
        const delCourseBtn = e.target.closest('.btn-delete-course');

        if (addDiscBtn) {
            addDisciplina.dataset.courseId = addDiscBtn.dataset.courseId;
            abrirPopupDisciplina();
            return;
        }

        if (delDiscBtn) {
            const disciplinaCard = delDiscBtn.closest('.disciplina-card');
            const disciplinaName = disciplinaCard.querySelector('h3').textContent;
            const disciplinaCodigo = delDiscBtn.dataset.disciplinaCode;
            
            handleExclusion('disciplina', disciplinaCodigo, disciplinaName, async () => {
                // Lógica de verificação: checar se existem turmas
                const res = await fetch(`/turmas?codigo_disciplina=${encodeURIComponent(disciplinaCodigo)}`);
                const data = await res.json();
                const turmas = data.turmas || [];
                return turmas.length;
            }, () => {
                excluirDisciplina(disciplinaCodigo);
            });
            return;
        }

        if (delCourseBtn) {
            const courseCard = delCourseBtn.closest('.course');
            const courseName = courseCard.querySelector('h2').textContent;
            const courseId = delCourseBtn.dataset.courseId;

            handleExclusion('curso', courseId, courseName, async () => {
                // Lógica de verificação: checar se existem disciplinas
                const res = await fetch(`/disciplinas?courseId=${encodeURIComponent(courseId)}`);
                const data = await res.json();
                const disciplinas = data.disciplinas || [];
                return disciplinas.length;
            }, () => {
                excluirCurso(courseId);
            });
            return;
        }
    });

    // --- FUNÇÕES DE EXCLUSÃO ---

    async function excluirDisciplina(disciplinaCodigo) {
        try {
            const response = await fetch(`/deleteDisciplina?codigo=${encodeURIComponent(disciplinaCodigo)}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                alert('Disciplina excluída com sucesso!');
                loadCoursesForInstitution(institutionId); // Recarrega os cursos para atualizar a lista
            } else {
                const err = await response.json().catch(() => null);
                alert(err?.message || 'Erro ao excluir disciplina.');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro ao excluir disciplina.');
        } finally {
            closeExclusionModal();
        }
    }

    async function excluirCurso(courseId) {
        try {
            const response = await fetch(`/deleteCurso?courseId=${encodeURIComponent(courseId)}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                alert('Curso excluído com sucesso!');
                loadCoursesForInstitution(institutionId);
            } else {
                const err = await response.json().catch(() => null);
                alert(err?.message || 'Erro ao excluir curso.');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro ao excluir curso.');
        } finally {
            closeExclusionModal();
        }
    }

    // --- LÓGICA DO MODAL DE EXCLUSÃO ---

    let confirmHandler = null; // Armazena o handler de confirmação

    async function handleExclusion(type, id, name, checkDependencies, onConfirm) {
        const itemNameEl = document.getElementById('exclusion_item_name');
        const bodyTextEl = document.getElementById('exclusion_body_text');
        const confirmButton = document.getElementById('confirm-btn');
        const cancelButton = document.getElementById('cancel-btn');

        itemNameEl.textContent = name;
        bodyTextEl.textContent = `Verificando dependências para ${type}...`;
        confirmButton.disabled = true;
        confirmButton.textContent = 'Verificando...';

        window.exclusion_modal(); // Abre o modal

        const dependencyCount = await checkDependencies();

        if (dependencyCount > 0) {
            const dependencyType = type === 'curso' ? 'disciplinas' : 'turmas';
            bodyTextEl.textContent = `Não é possível excluir. Existem ${dependencyCount} ${dependencyType} vinculadas a este ${type}. Remova-as primeiro.`;
            confirmButton.textContent = 'Exclusão impossível';
            confirmButton.disabled = true;
        } else {
            bodyTextEl.textContent = 'Esta ação é irrevogável. Deseja continuar?';
            confirmButton.disabled = false;
            confirmButton.textContent = 'Sim, excluir';

            // Remove o listener anterior e adiciona o novo
            if (confirmHandler) {
                confirmButton.removeEventListener('click', confirmHandler);
            }
            confirmHandler = () => {
                onConfirm(id);
            };
            confirmButton.addEventListener('click', confirmHandler, { once: true });
        }
    }
    
    function closeExclusionModal() {
        const modal = document.getElementById('exclusion_modal');
        if (modal) modal.classList.remove('active');
    }


    // --- FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO ---

    // ----------------------------------------------------------------------------------------------------
    // funções para modal

    function abrirPopup() {
        fundoBlur.classList.add('mostrar');
        popupConteudo.classList.add('mostrar');
        popupDisciplina.classList.remove('mostrar');
        popupTurma.classList.remove('mostrar');
    }

    function fecharPopup() {
        fundoBlur.classList.remove('mostrar');
        popupConteudo.classList.remove('mostrar');
    }

    function abrirPopupDisciplina() {
        fundoBlur.classList.add('mostrar');
        popupDisciplina.classList.add('mostrar');
        popupConteudo.classList.remove('mostrar');
        popupTurma.classList.remove('mostrar');
    }

    function fecharPopupDisciplina() {
        fundoBlur.classList.remove('mostrar');
        popupDisciplina.classList.remove('mostrar');
    }
    
    function abrirPopupTurma() {
        fundoBlur.classList.add('mostrar');
        popupTurma.classList.add('mostrar');
        popupConteudo.classList.remove('mostrar');
        popupDisciplina.classList.remove('mostrar');
    }

    function fecharPopupTurma() {
        fundoBlur.classList.remove('mostrar');
        popupTurma.classList.remove('mostrar');
    }
    



    //---------------------------------------------------------------------------------------------------------------
    // funcao para carregar cursos ja cadastrados

    async function loadCoursesForInstitution(institutionId) {
        if (!listaCursosContainer) return;
        listaCursosContainer.innerHTML = '<p>Carregando cursos...</p>';

        try {
            const res = await fetch(`/cursos?institutionId=${encodeURIComponent(institutionId)}`);
            if (!res.ok) throw new Error('Erro ao buscar cursos');
            const data = await res.json();
            const cursos = data.cursos ?? [];

            if (!Array.isArray(cursos) || cursos.length === 0) {
                listaCursosContainer.innerHTML = '<p>Nenhum curso encontrado para esta instituição.</p>';
                return;
            }

            listaCursosContainer.innerHTML = '';
            cursos.forEach(curso => {
                const cursoId = curso.id_curso ?? curso.id ?? curso.idCurso;
                const nomeCurso = curso.nome_curso ?? curso.nome ?? 'Curso sem nome';

                const card = document.createElement('div');
                card.className = 'course';
                card.innerHTML = `
                    <div class="course-header">
                        <div class="icon"><img src="/assets/images/book.png" alt="Curso"></div>
                        <h2>${escapeHtml(nomeCurso)}</h2>
                        <div class="btn-group">
                            <button class="btn-primary btn-edit-course" data-course-id="${escapeHtml(cursoId)}" title="Editar">
                                <img src="/assets/images/pencil.png" alt="Editar" />
                            </button>
                            <button class="btn-primary btn-delete-course" data-course-id="${escapeHtml(cursoId)}" title="Excluir">
                                <img src="/assets/images/trash.png" alt="Excluir" />
                            </button>
                            <button class="btn-primary btn-add-disciplina" data-course-id="${escapeHtml(cursoId)}">+ Adicionar Disciplina</button>
                        </div>
                    </div>
                    <div class="disciplinas-container">
                        <p style="color: #999; font-size: 0.9rem;">Carregando disciplinas...</p>
                    </div>
                `;
                listaCursosContainer.appendChild(card);

                loadDisciplinesForCourse(cursoId, card); 
            });
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
            if (listaCursosContainer) listaCursosContainer.innerHTML = '<p>Erro ao carregar cursos.</p>';
        }
    }


//----------------------------------------------------------------------------------------------------------------------------------
// funcao para carregar disciplinas cadastradas de cada curso


    async function loadDisciplinesForCourse(cursoId, courseElement) {
        try {
            const res = await fetch(`/disciplinas?courseId=${encodeURIComponent(cursoId)}`);
            if (!res.ok) throw new Error('Erro ao buscar disciplinas');

            const data = await res.json();
            const disciplinas = data.disciplinas ?? [];

            const container = courseElement.querySelector('.disciplinas-container');
            container.innerHTML = '';

            if (disciplinas.length === 0) {
                container.innerHTML = '<p style="color: #999; font-size: 0.9rem;">Nenhuma disciplina encontrada</p>';
                return;
            }

            disciplinas.forEach(disc => {
                const discCard = document.createElement('div');
                discCard.className = 'disciplina-card';
                discCard.innerHTML = `
                    <div class="disciplina-header">
                        <div class="disciplina-info">
                            <h3>${escapeHtml(disc.nome_disciplina ?? 'Sem nome')}</h3>
                            <p>Código: ${escapeHtml(disc.codigo_disciplina ?? '-')} | Período: ${escapeHtml(disc.periodo ?? '-')}</p>
                        </div>
                        <div class="disciplina-acoes">
                            <button class="icon-btn" title="Editar"><img src="/assets/images/pencil.png" alt="Editar" /></button>
                            <button class="icon-btn" title="Excluir"><img src="/assets/images/trash.png" alt="Excluir" /></button>
                            
                            <button class="btn-primary btn-add-turma" data-disciplina-id="${escapeHtml(disc.codigo_disciplina)}">+ Adicionar Turma</button>
                        </div>
                    </div>
                    <div class="turmas-container"></div>
                `;
                container.appendChild(discCard);
                loadTurmasForDisciplinas(disc.codigo_disciplina, discCard );
            });
            
        } catch (err) {
            console.error('Erro ao carregar disciplinas:', err);
            const container = courseElement.querySelector('.disciplinas-container');
            if (container) container.innerHTML = '<p style="color: #999; font-size: 0.9rem;">Erro ao carregar disciplinas</p>';
        }
    }

//----------------------------------------------------------------------------------------------------------------------------------
// funçao para carregar turmas dentro de disciplina


    async function loadTurmasForDisciplinas(disciplinaCodigo, disciplinaElement) {
        const turmaContainer = disciplinaElement.querySelector('.turmas-container');
        if(!turmaContainer){
            return;
        }
        try{
            const resultado = await fetch(`/BuscarTurmas?disciplinaId=${encodeURIComponent(disciplinaCodigo)}`)
            if(!resultado.ok){
                throw new Error('Erro ao buscar turmas');
            }
            const data = await resultado.json();
            const turmas = data.turmas ?? []; 

            turmaContainer.innerHTML = ''; 
            
            if (turmas.length === 0) {
                turmaContainer.innerHTML = '<p style="font-size: 0.8rem; color: #aaa;">(Nenhuma turma cadastrada)</p>';
                return;
            }

            turmas.forEach(turma => {

                const turmaCard = document.createElement('div');
                turmaCard.className = 'turma-card';
                turmaCard.setAttribute('data-turma-id', turma.id_turma); // Adicionar ID ao card
 
                turmaCard.innerHTML = `
                    <div class="turma-header">
                        <p class="turma-nome">${escapeHtml(turma.nome_turma ?? turma.codigo_turma)}</p>
                        <div class="turma-acoes">
                            <button class="icon-btn btn-delete-turma" data-turma-id="${turma.id_turma}" title="Excluir">
                                <img src="/assets/images/trash.png" alt="Excluir" />
                            </button>
                        </div>
                    </div>
                `;
                
                turmaContainer.appendChild(turmaCard);
        });

        }catch(error){
            console.error('Erro ao carregar turmas');
            turmaContainer.innerHTML = '<p style="color: red; font-size: 0.9rem;">Erro ao carregar turmas.</p>';
        }
    }




//----------------------------------------------------------------------------------------------------------------------------------
// funçao paa os cliques dos botoes 


    listaCursosContainer.addEventListener('click', (e) => {
        

        const addDiscBtn = e.target.closest('.btn-add-disciplina');
        if (addDiscBtn) {
            addDisciplina.dataset.courseId = addDiscBtn.dataset.courseId;
            abrirPopupDisciplina();
            return;
        }

       
        const addTurmaClique = e.target.closest('.btn-add-turma'); 
        if (addTurmaClique) {
            addTurma.dataset.disciplinaId = addTurmaClique.dataset.disciplinaId; 
            abrirPopupTurma();
            return;
        }


        const editBtn = e.target.closest('.btn-edit-course');
        if (editBtn) {
            const courseId = editBtn.dataset.courseId;
            return;
        }

        const delBtn = e.target.closest('.btn-delete-course');
        if (delBtn) {
            const courseId = delBtn.dataset.courseId;
            return;
        }

        const turmaCardClick = e.target.closest('.turma-card'); 
        if (turmaCardClick) {
            const turmaId = turmaCardClick.getAttribute('data-turma-id');
            window.location.href = `/frontend/pages/students.html?turmaId=${turmaId}`;
            return;
        }

    });

//----------------------------------------------------------------------------------------------------------------------------------
// parte para adicionar cursos

    if (addButton) {
        addButton.addEventListener('click', async () => {
            const courseNameInput = document.getElementById('course-name-pop-up');
            const courseName = courseNameInput.value.trim();
            if (!courseName) return alert('Por favor, insira o nome do curso.');

            try {
                const response = await fetch('/addcursos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome_curso: courseName, instituicao_id: institutionId }),
                });
                if (response.ok) {
                    alert('Curso adicionado com sucesso!');
                    courseNameInput.value = '';
                    fecharPopup();
                    loadCoursesForInstitution(institutionId);
                } else {
                    alert('Erro ao adicionar curso.');
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro ao adicionar curso.');
            }
        });
    }


//----------------------------------------------------------------------------------------------------------------------------------
// parte para adicionar disciplinas

    if (addDisciplina) {
        addDisciplina.addEventListener('click', async () => {
            const courseId = addDisciplina.dataset.courseId;
            const disciplinaName = document.getElementById('nomeDisciplina').value.trim();
            const disciplinaCode = document.getElementById('codDisciplina').value.trim();
            const disciplinaPeriodo = document.getElementById('PerDisciplina')?.value.trim() ?? '';

            if (!disciplinaName || !disciplinaCode) return alert('Nome e código são obrigatórios.');

            try {
                const response = await fetch('/adddisciplina', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome_disciplina: disciplinaName,
                        codigo_disciplina: disciplinaCode,
                        periodo: disciplinaPeriodo,
                        curso_id: courseId,
                        instituicao_id: institutionId, 
                    }),
                });
                if (response.ok) {
                    alert('Disciplina adicionada com sucesso!');
                    document.getElementById('nomeDisciplina').value = '';
                    document.getElementById('codDisciplina').value = '';
                    if (document.getElementById('PerDisciplina')) document.getElementById('PerDisciplina').value = '';
                    loadCoursesForInstitution(institutionId);
                    fecharPopupDisciplina();
                } else {
                    const err = await response.json();
                    alert('Erro: ' + err.message);
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro ao adicionar disciplina.');
            }
        });
    }


//----------------------------------------------------------------------------------------------------------------------------------
// parte para adicionar turmas

    if(addTurma){
        addTurma.addEventListener('click', async() =>{
            const disciplinaId = addTurma.dataset.disciplinaId;
            const codigoTurma = document.getElementById('codTurma').value;
            const nomeTurma = document.getElementById('nomeTurma').value;
            if (!codigoTurma || !nomeTurma) {
                return alert('Nome e código são obrigatórios.');
            }
            
            try {
            
                const resposta = await fetch('/addTurma', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        codigo_turma: codigoTurma,
                        nome_turma: nomeTurma,
                        id_disciplina: disciplinaId
                    }),
                });

                const result = await resposta.json();
                
                if (resposta.ok) {
                    alert('Turma adicionada com sucesso!');
                    fecharPopupTurma();
                    loadCoursesForInstitution(institutionId); 
                } else {
                    alert(`Erro: ${result.message || 'Falha ao adicionar turma.'}`);
                }

            } catch (error) {
                console.error('Erro na requisição de Turma:', error);
                alert('Erro de conexão com o servidor.');
            }

        });
    }




//----------------------------------------------------------------------------------------------------------------------------------
// Outros Listeners de Fechar o modal


    document.querySelectorAll('.close-pop-up').forEach(btn => {
        btn.addEventListener('click', () => {
            fecharPopup();
            fecharPopupDisciplina();
            fecharPopupTurma();
        });
    });

    fundoBlur.addEventListener('click', (event) => {
        if (event.target === fundoBlur) {
            fecharPopup();
            fecharPopupDisciplina();
            fecharPopupTurma();
        }
    });
//----------------------------------------------------------------------------------------------------------------------------------
// helper

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

//----------------------------------------------------------------------------------------------------------------------------------
// listener fixo 

if (botaoAbrir) {
    botaoAbrir.addEventListener('click', abrirPopup);
}

});
