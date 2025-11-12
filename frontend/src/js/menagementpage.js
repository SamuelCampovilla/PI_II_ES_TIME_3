// ...existing code...
document.addEventListener('DOMContentLoaded', async () => {

    const botaoAbrir = document.getElementById('add-course');
    const botaoFechar = document.getElementById('close-pop-up');
    const fundoBlur = document.getElementById('blurred-bg'); 
    const popupConteudo = document.getElementById('pop-up'); 
    const addButton = document.getElementById('btnAdicionar');
    const listaCursosContainer = document.getElementById('lista_cursos');
    const addDisciplina = document.getElementById('btnAddDisciplina');
    
    const urlParams = new URLSearchParams(window.location.search);
    const institutionId = urlParams.get('institutionId');
    const docenteEmail = urlParams.get('email');

    // busca e exibe nome da instituição
    if (institutionId) {
        try {
            const response = await fetch(`/institution/${institutionId}`);
            if (response.ok) {
                const institution = await response.json();
                const institutionNameElement = document.getElementById('nome_instituicao');
                if (institutionNameElement) {
                    institutionNameElement.textContent = institution.nome_instituicao;
                }
            } else {
                console.error('Erro ao buscar dados da instituição');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
        }

        // carregar cursos da instituição ao abrir a página
        loadCoursesForInstitution(institutionId);
    } else {
        if (listaCursosContainer) listaCursosContainer.innerHTML = '<p>ID da instituição não fornecido na URL.</p>';
    }

    // função para buscar e renderizar cursos
    async function loadCoursesForInstitution(institutionId) {
        if (!listaCursosContainer) return;
        listaCursosContainer.innerHTML = '<p>Carregando cursos...</p>';

        try {
            const res = await fetch(`/cursos?institutionId=${encodeURIComponent(institutionId)}`);
            if (!res.ok) {
                throw new Error('Erro ao buscar cursos');
            }
            const data = await res.json();
            const cursos = data.cursos ?? [];

            if (!Array.isArray(cursos) || cursos.length === 0) {
                listaCursosContainer.innerHTML = '<p>Nenhum curso encontrado para esta instituição.</p>';
                return;
            }

   // ...existing code...
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
                            <button class="btn-primary edit" data-course-id="${escapeHtml(cursoId)}" title="Editar"><img src="/assets/images/pencil.png" alt="Editar"></button>
                            <button class="btn-primary delete" data-course-id="${escapeHtml(cursoId)}" title="Excluir"><img src="/assets/images/trash.png" alt="Excluir"></button>
                             <button id="btnAddDisciplina" class="btn-primary add" data-course-id="${escapeHtml(cursoId)}">+ Adicionar Disciplina</button>
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
            const res = await fetch(`/disciplinas?cursoId=${encodeURIComponent(cursoId)}`);
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
                            <button class="icon-btn edit" title="Editar"><img src="/assets/images/pencil.png" alt="Editar"></button>
                            <button class="icon-btn delete" title="Excluir"><img src="/assets/images/trash.png" alt="Excluir"></button>
                            <button class="btn-primary add" data-course-id="${escapeHtml(cursoId)}">+ Adicionar Turma</button> 
                        </div>
                    </div> 
                    
                    <div class="turmas-container">
                        <!-- Turmas serão carregadas aqui -->
                    </div>
                `;
                container.appendChild(discCard);
            });
            
        } catch (err) {
            console.error(err);
        }
    }
    // delegação de eventos para botões "Gerenciar"
    if(listaCursosContainer) {
        listaCursosContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.manage-course');
            if (!btn) return;
            const courseId = btn.dataset.courseId;
            window.location.href = `/courseManagement.html?institutionId=${encodeURIComponent(institutionId)}&courseId=${encodeURIComponent(courseId)}`;
        });
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

    if(addButton) {
        addButton.addEventListener('click', async () => {
            const courseNameInput = document.getElementById('course-name-pop-up');
            const courseName = courseNameInput.value.trim();
            if (courseName) {
                try {
                    const response = await fetch('/addcursos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            nome_curso: courseName,
                            instituicao_id: institutionId,
                        }),
                    });
                    if (response.ok) {
                        alert('Curso adicionado com sucesso!');
                        courseNameInput.value = '';
                        fecharPopup();
                        // recarrega a lista de cursos
                        loadCoursesForInstitution(institutionId);
                    } else {
                        alert('Erro ao adicionar curso.');
                    }
                } catch (error) {
                    console.error('Erro na requisição:', error);
                    alert('Erro ao adicionar curso.');
                }
            } else {
                alert('Por favor, insira o nome do curso.');
            }
        });
    }

    function abrirPopup() {
        fundoBlur.classList.add('mostrar');
        popupConteudo.classList.add('mostrar');
    }

    function fecharPopup() {
        fundoBlur.classList.remove('mostrar');
        popupConteudo.classList.remove('mostrar');
    }

    botaoAbrir.addEventListener('click', abrirPopup);
    botaoFechar.addEventListener('click', fecharPopup);
    fundoBlur.addEventListener('click', (event) => {
        if (event.target === fundoBlur) {
            fecharPopup();
        }
    });
});
// ...existing code...