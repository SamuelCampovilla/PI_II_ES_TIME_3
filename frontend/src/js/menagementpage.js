document.addEventListener('DOMContentLoaded', async () => {
 const botaoAbrir = document.getElementById('add-course');
    // const fundoBlurDisciplina = document.getElementById('blurred-bg-disciplina'); // REMOVIDO
    const fundoBlur = document.getElementById('blurred-bg');
    const popupConteudo = document.getElementById('pop-up');
    const popupDisciplina = document.getElementById('pop-up-disciplina');
    const addButton = document.getElementById('btnAdicionar'); // adiciona curso
    const addDisciplina = document.getElementById('btnAdicionarDisciplina'); // botão do modal de disciplina
    const listaCursosContainer = document.getElementById('lista_cursos');

    const popupTurma = document.getElementById('pop-up-turma');
    const addTurmaBtn = document.getElementById('btnAdicionarTurma');   

    const urlParams = new URLSearchParams(window.location.search);
    const institutionId = urlParams.get('institutionId');
    const docenteEmail = urlParams.get('email');

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

    // Delegação: captura cliques em botões gerados dinamicamente dentro da lista de cursos
    listaCursosContainer.addEventListener('click', (e) => {
        // botão "Adicionar Disciplina"
        const addDiscBtn = e.target.closest('.btn-add-disciplina');
        if (addDiscBtn) {
            // guarda o courseId no botão do modal para uso no envio
            addDisciplina.dataset.courseId = addDiscBtn.dataset.courseId;
            abrirPopupDisciplina();
            return;
        }

        
        const delDiscBtn = e.target.closest('.btn-delete-disciplina');
        if (delDiscBtn) {
            const disciplinaCodigo = delDiscBtn.dataset.disciplinaCode;
            if (!disciplinaCodigo) return alert('Código da disciplina não encontrado.');
            if (!confirm('Tem certeza que deseja excluir esta disciplina?')) return;
            excluirDisciplina(disciplinaCodigo);
            return;
        }

        const editBtn = e.target.closest('.btn-edit-course');
        if (editBtn) {
            const courseId = editBtn.dataset.courseId;
        
            return;
        }

        // exemplo: excluir curso
        const delBtn = e.target.closest('.btn-delete-course');
        if (delBtn) {
            const courseId = delBtn.dataset.courseId;
            // implementar exclusão se necessário
            return;
        }
    });

    // agora exclui pelo código da disciplina (codigo_disciplina)
    async function excluirDisciplina(disciplinaCodigo) {
        try {
            const response = await fetch(`/deleteDisciplina?codigo=${encodeURIComponent(disciplinaCodigo)}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                alert('Disciplina excluída com sucesso!');
                loadCoursesForInstitution(institutionId);
            } else {
                const err = await response.json().catch(() => null);
                const msg = err && err.message ? err.message : 'Erro ao excluir disciplina.';
                alert(msg);
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro ao excluir disciplina.');
        }
    }

    // função para buscar e renderizar cursos
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

                // Carregar disciplinas deste curso
                loadDisciplinesForCourse(cursoId, card);
            });
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
            if (listaCursosContainer) listaCursosContainer.innerHTML = '<p>Erro ao carregar cursos.</p>';
        }
    }

    // Função para carregar disciplinas de um curso
    async function loadDisciplinesForCourse(cursoId, courseElement) {
        try {
            // ajustar para 'courseId' ou 'cursoId' conforme servidor; aqui usamos courseId
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
                                    <button class="icon-btn btn-delete-disciplina" data-disciplina-code="${escapeHtml(disc.codigo_disciplina ?? '')}" title="Excluir"><img src="/assets/images/trash.png" alt="Excluir" /></button>
                                    <button class="btn-primary btn-add-turma" data-course-id="${escapeHtml(cursoId)}">+ Adicionar Turma</button>
                                </div>
                    </div>
                    <div class="turmas-container"></div>
                `;
                container.appendChild(discCard);
            });
            
        } catch (err) {
            console.error('Erro ao carregar disciplinas:', err);
            const container = courseElement.querySelector('.disciplinas-container');
            if (container) container.innerHTML = '<p style="color: #999; font-size: 0.9rem;">Erro ao carregar disciplinas</p>';
        }
    }

    // adicionar curso (modal)
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

    // adicionar disciplina (modal) - utiliza dataset.courseId preenchido ao abrir o modal
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

    document.querySelectorAll('.close-pop-up').forEach(btn => {
        btn.addEventListener('click', () => {
            fecharPopup();
            fecharPopupDisciplina();
        });
    });

    // deletion of disciplines is handled via event delegation on listaCursosContainer

    // fechar clicando no backdrop (agora usa o mesmo backdrop para ambos)
    fundoBlur.addEventListener('click', (event) => {
        if (event.target === fundoBlur) {
            fecharPopup();
            fecharPopupDisciplina();
        }
    });


    function abrirPopup() {
        fundoBlur.classList.add('mostrar');
        popupConteudo.classList.add('mostrar');
        popupDisciplina.classList.remove('mostrar');
    }

    function fecharPopup() {
        fundoBlur.classList.remove('mostrar');
        popupConteudo.classList.remove('mostrar');
    }

    function abrirPopupDisciplina() {
        fundoBlur.classList.add('mostrar');
        popupDisciplina.classList.add('mostrar');
        popupConteudo.classList.remove('mostrar');
    }

    function fecharPopupDisciplina() {
        fundoBlur.classList.remove('mostrar');
        popupDisciplina.classList.remove('mostrar');
    }

    // helper para escapar HTML básico
    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
    // inicializar listeners de botões fixos
    botaoAbrir?.addEventListener('click', abrirPopup);




});