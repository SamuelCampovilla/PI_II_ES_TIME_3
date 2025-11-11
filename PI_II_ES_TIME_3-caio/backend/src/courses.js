
//codigo para adicionar curso Caio Polo e Cauã Bianch.
//Importar biblioteca do supabase

import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';

const supabase = createClient(supabaseUrl, supabaseKey);

//função de adicionar novo curso

async function addNovoCurso(courseName, instituicaoId) {
//inserir dados dentro da tabela de cursos no supavbase
    const {data, error} = await supabase
        .from('cursos')
        .insert([
            {nome_curso: courseName, id_instituicao: instituicaoId}
        ])
        .select();

    if(error){
        console.error('Erro ao adicionar curso:', error);
        alert('Erro ao adicionar curso. Verifique o console.');
    }else{
        console.log('Curso adicionado com sucesso:', data);

        window.location.reload();
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

    pop_up();
    //pega o id da instituição na url
    const params = new URLSearchParams(window.location.search);
    const idInstituicao = params.get('id');
    console.log("ID instituição:", idInstituicao);

    //buscas dos dados ja existentes do banco de dados
    const{data: courses, error} = await supabase
        .from('cursos')
        .select('*')
        .eq('id_instituicao', idInstituicao);  
        
        
    if(error){
        console.error('Erro ao buscar cursos:', error);
        return;
    }
    //variavel apra pegar a div lista_curso do menagementPage.html
    const courseList = document.querySelector('#lista_cursos');

    if(!courseList){
        console.log("elemento 'courseList' não encontrado");
        return;
    }
    //cria a variavel htmlcontent para adicionar cada curso Um por Um encontrados no banco de dados
    let htmlContent = '';

    for(const course of courses){
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
    }

    //faz aparecer os cursos na tela
    courseList.innerHTML = htmlContent;

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