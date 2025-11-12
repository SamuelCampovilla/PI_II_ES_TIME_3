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

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/card-styles.css'; 
    document.head.appendChild(link);

    pop_up();
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
        }
    } catch (error) {
        console.error('Erro ao buscar cursos:', error);
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