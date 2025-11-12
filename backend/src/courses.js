//codigo para adicionar curso Caio Polo e Cauã Bianch.

//função de adicionar novo curso

async function addNovoCurso(courseName, instituicaoId) {
    try {
        const response = await fetch(`/addCurso?institutionId=${instituicaoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ courseName }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erro ao adicionar curso.');
        }

        alert('Curso adicionado com sucesso!');
        location.reload(); // Recarregar a página para mostrar o novo curso

    } catch (error) {
        console.error('Erro ao adicionar curso:', error);
        alert(error.message);
    }
}
// função para abrir e fechar o pop-up
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

//parte principal do código com o html e chamar as funções
document.addEventListener('DOMContentLoaded', async() =>{

    //pega o id da instituição na url
    const params = new URLSearchParams(window.location.search);
    const idInstituicao = params.get('id');
    console.log("ID instituição:", idInstituicao);

    //buscas dos dados ja existentes do banco de dados
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
                                <button class="btn btn-primary">+ Nova Disciplina</button>
                                <button class="btn-icon" title="Editar Curso"><img src="/assets/images/pencil.png" alt=""></button>
                                <button class="btn-icon" title="Excluir Curso"><img src="/assets/images/trash.png" alt=""></button>
                            </div>
                        </div>
                        <div class="disciplines"></div>
                    </div>`;
            });
            courseList.innerHTML = htmlContent;

            // Após renderizar os cursos, buscar e exibir as disciplinas de cada um
            fetchAndDisplayDisciplinas();
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
                        data.disciplinas.forEach(disciplina => {
                            disciplinesHtml += `<div class="discipline">${disciplina.nome_disciplina}</div>`;
                        });
                    } else {
                        disciplinesHtml = '<div class="no-disciplines">Nenhuma disciplina encontrada.</div>';
                    }
                    disciplinesContainer.innerHTML = disciplinesHtml;

                } catch (error) {
                    console.error(`Erro ao buscar disciplinas para o curso ${courseId}:`, error);
                    disciplinesContainer.innerHTML = '<div class="error-disciplines">Erro ao carregar disciplinas.</div>';
                }
            }
        }
    }

    const btnAdicionar = document.getElementById('btnAdicionar');
    const courseNameInput = document.getElementById('course-name-pop-up');
    // ao clicar no boatao de adicionar curso, chama a função addNovoCurso
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', () => {
            const newCourseName = courseNameInput.value;
            addNovoCurso(newCourseName, idInstituicao); 
        });
    } else {
         console.log("Botão 'btnAdicionar' não encontrado no DOM.");
    }
})