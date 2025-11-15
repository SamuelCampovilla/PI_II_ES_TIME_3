//codigo para adicionar curso Caio Polo e Cauã Bianch.

//função de adicionar novo curso

async function addNovoCurso(courseName, instituicaoId) {
    try {
        const response = await fetch(`/addcursos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                nome_curso: courseName, 
                instituicao_id: instituicaoId 
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erro ao adicionar curso.');
        }

        alert('Curso adicionado com sucesso!');
        location.reload(); 

    } catch (error) {
        console.error('Erro ao adicionar curso:', error);
        alert(error.message);
    }
}

async function deleteCourse(courseId) {
    const confirmation = await showDeleteConfirmation(courseId);
}

function pop_up_exclusao(courseId) {
    return new Promise((resolve) => {
        const existingModal = document.getElementById('pop-up-exclusao');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div id="pop-up-exclusao" class="pop-up-exclusao" style="display: block;">
                <div class="pop-up-exclusao-content">
                    <p>Tem certeza que deseja excluir este curso?</p>
                    <div class="btn-group">
                        <button id="confirm-delete" class="btn btn-danger">Confirmar</button>
                        <button id="cancel-delete" class="btn btn-secondary">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const confirmBtn = document.getElementById('confirm-delete');
        const cancelBtn = document.getElementById('cancel-delete');
        const modal = document.getElementById('pop-up-exclusao');

        confirmBtn.onclick = async () => {
            try {
                const response = await fetch(`/deleteCurso?courseId=${courseId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.message || 'Erro ao excluir curso.');
                }

                alert('Curso excluído com sucesso!');
                location.reload();
            } catch (error) {
                console.error('Erro ao excluir curso:', error);
                alert(error.message);
            }
            modal.remove();
            resolve(true);
        };

        cancelBtn.onclick = () => {
            modal.remove();
            resolve(false);
        };
    });
}

async function showDeleteConfirmation(courseId) {
    return await pop_up_exclusao(courseId);
}

function pop_up() {
    const botaoAbrir = document.getElementById('add-course');
    const botaoFechar = document.getElementById('close-pop-up');
    const fundoBlur = document.getElementById('blurred-bg'); 
    const popupConteudo = document.getElementById('pop-up'); 

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
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idInstituicao = params.get('id');
    console.log("ID instituição:", idInstituicao);

    try {
        const response = await fetch(`/cursos?institutionId=${idInstituicao}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao buscar cursos.');
        }

        const courseList = document.querySelector('#lista_cursos');
        if (courseList && data.cursos) {
            let htmlContent = '';
            data.cursos.forEach(course => {
                htmlContent += `
                <div class="course" data-course-id="${course.id_curso}"> 
                    <div class="course-header">
                        <span><img src="/assets/images/book.png" alt=""> ${course.nome_curso}</span>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-add-disciplina" data-course-id="${course.id_curso}">+ Nova Disciplina</button>
                            <button class="btn-icon btn-edit-course" title="Editar Curso" data-course-id="${course.id_curso}"><img src="/assets/images/pencil.png" alt=""></button>
                            <button class="btn-icon btn-delete-course" title="Excluir Curso" data-course-id="${course.id_curso}"><img src="/assets/images/trash.png" alt=""></button>
                        </div>
                    </div>
                    <div class="disciplines"></div>
                </div>`;
            });
            courseList.innerHTML = htmlContent;

            fetchAndDisplayDisciplinas();

            courseList.addEventListener('click', (event) => {
                const target = event.target;
                const courseElement = target.closest('.course');
                if (!courseElement) return;

                const courseId = courseElement.dataset.courseId;

                if (target.closest('.btn-delete-course')) {
                    deleteCourse(courseId);
                }
            });
        }
    } catch (error) {
        console.error('Erro ao buscar cursos:', error);
    }

    async function fetchAndDisplayDisciplinas() {
        const courseElements = document.querySelectorAll('.course');
        for (const courseElement of courseElements) {
            const courseId = courseElement.dataset.courseId;
            const disciplinesContainer = courseElement.querySelector('.disciplines');

            if (courseId) {
                try {
                    const response = await fetch(`/disciplinas?courseId=${courseId}`);
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Erro ao buscar disciplinas.');
                    }

                    let disciplinesHtml = '';
                    if (data.disciplinas && data.disciplinas.length > 0) {
                        for (const disciplina of data.disciplinas) {
                            disciplinesHtml += `
                                <div class="discipline" data-discipline-id="${disciplina.codigo_disciplina}">
                                    <div class="discipline-header">
                                        <span>${disciplina.nome_disciplina}</span>
                                        <div class="btn-group">
                                            <button class="btn btn-secondary btn-add-turma" data-discipline-id="${disciplina.codigo_disciplina}">+ Nova Turma</button>
                                        </div>
                                    </div>
                                    <div class="turmas"></div>
                                </div>`;
                        }
                    } else {
                        disciplinesHtml = '<div class="no-disciplines">Nenhuma disciplina encontrada.</div>';
                    }
                    disciplinesContainer.innerHTML = disciplinesHtml;

                 
                    fetchAndDisplayTurmas();

                } catch (error) {
                    console.error(`Erro ao buscar disciplinas para o curso ${courseId}:`, error);
                    disciplinesContainer.innerHTML = '<div class="error-disciplines">Erro ao carregar disciplinas.</div>';
                }
            }
        }
    }

    async function fetchAndDisplayTurmas() {
        const disciplineElements = document.querySelectorAll('.discipline');
        for (const disciplineElement of disciplineElements) {
            const disciplineId = disciplineElement.dataset.disciplineId;
            const turmasContainer = disciplineElement.querySelector('.turmas');

            if (disciplineId) {
                try {
                    const response = await fetch(`/turmas?codigo_disciplina=${disciplineId}`);
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Erro ao buscar turmas.');
                    }

                    let turmasHtml = '';
                    if (data.turmas && data.turmas.length > 0) {
                        data.turmas.forEach(turma => {
                            turmasHtml += `<div class="turma"><a href="../pages/students.html?id_turma=${turma.id_turma}">${turma.nome_turma}</a></div>`;
                        });
                    } else {
                        turmasHtml = '<div class="no-turmas">Nenhuma turma encontrada.</div>';
                    }
                    turmasContainer.innerHTML = turmasHtml;

                } catch (error) {
                    console.error(`Erro ao buscar turmas para a disciplina ${disciplineId}:`, error);
                    turmasContainer.innerHTML = '<div class="error-turmas">Erro ao carregar turmas.</div>';
                }
            }
        }
    }

    const btnAdicionar = document.getElementById('btnAdicionar');
    const courseNameInput = document.getElementById('course-name-pop-up');
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', () => {
            const newCourseName = courseNameInput.value;
            if (newCourseName) {
                addNovoCurso(newCourseName, idInstituicao);
            } else {
                alert('Por favor, insira o nome do curso.');
            }
        });
    } else {
        console.log("Botão 'btnAdicionar' não encontrado no DOM.");
    }

    pop_up();
});