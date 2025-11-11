import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addNovoCurso(courseName, instituicaoId) {
    if (!courseName || !courseName.trim()) {
        alert('Digite o nome do curso.');
        return;
    }
    const {data, error} = await supabase
        .from('cursos')
        .insert([{ nome_curso: courseName.trim(), id_instituicao: instituicaoId }])
        .select();

    if (error) {
        console.error('Erro ao adicionar curso:', error);
        alert('Erro ao adicionar curso. Verifique o console.');
    } else {
        console.log('Curso adicionado com sucesso:', data);
        window.location.reload();
    }
}

async function deleteCourse(courseId) {
    const { data, error } = await supabase
        .from('cursos')
        .delete()
        .eq('id_curso', courseId);
    if (error) {
        console.error('Erro ao excluir curso:', error);
        alert('Erro ao excluir curso. Verifique o console.');
    } else {
        console.log('Curso excluído com sucesso:', data);
        window.location.reload();
    }
}

function pop_up() {
    const botaoAbrir = document.getElementById('add-course');
    const botaoFechar = document.getElementById('close-pop-up');
    const fundoBlur = document.getElementById('blurred-bg');
    const popupConteudo = document.getElementById('pop-up');

    if (!botaoAbrir || !fundoBlur || !popupConteudo) return;

    function abrirPopup() {
        fundoBlur.classList.add('mostrar');
        popupConteudo.classList.add('mostrar');
    }

    function fecharPopup() {
        fundoBlur.classList.remove('mostrar');
        popupConteudo.classList.remove('mostrar');
    }

    botaoAbrir.addEventListener('click', abrirPopup);
    if (botaoFechar) botaoFechar.addEventListener('click', fecharPopup);
    fundoBlur.addEventListener('click', (event) => {
        if (event.target === fundoBlur) fecharPopup();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    pop_up();

    const params = new URLSearchParams(window.location.search);
    const idInstituicao = params.get('id');
    console.log("ID instituição:", idInstituicao);

    const { data: courses, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('id_instituicao', idInstituicao);

    if (error) {
        console.error('Erro ao buscar cursos:', error);
        return;
    }

    const courseList = document.querySelector('#lista_cursos');
    if (!courseList) {
        console.log("elemento 'courseList' não encontrado");
        return;
    }

    let htmlContent = '';
    for (const course of courses || []) {
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

    courseList.innerHTML = htmlContent;

    // registrar listeners para todos os botões de excluir (cada curso)
    const deleteButtons = courseList.querySelectorAll('.btnExcluirCurso');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (evt) => {
            const courseElement = evt.currentTarget.closest('.course');
            const courseId = courseElement?.dataset?.courseId;
            if (!courseId) {
                console.error('ID do curso não encontrado');
                return;
            }
            const confirmDelete = confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.');
            if (!confirmDelete) return;
            await deleteCourse(courseId);
        });
    });

    // opcional: listeners para editar / nova disciplina
    const editButtons = courseList.querySelectorAll('.btnEditarCurso');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (evt) => {
            const courseId = evt.currentTarget.closest('.course')?.dataset?.courseId;
            // abrir modal de edição (implemente conforme necessário)
            console.log('Editar curso', courseId);
        });
    });

    const novaDiscButtons = courseList.querySelectorAll('.btnNovaDisciplina');
    novaDiscButtons.forEach(btn => {
        btn.addEventListener('click', (evt) => {
            const courseId = evt.currentTarget.dataset.courseId;
            // abrir modal para adicionar disciplina (implemente conforme necessário)
            console.log('Adicionar disciplina ao curso', courseId);
        });
    });

    // adicionar comportamento do pop-up de adicionar curso (campo e botão dentro do pop-up)
    const btnAdicionar = document.getElementById('btnAdicionar');
    const courseNameInput = document.getElementById('course-name-pop-up');
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', () => {
            const newCourseName = courseNameInput?.value || '';
            addNovoCurso(newCourseName, idInstituicao);
        });
    } else {
        console.log("Botão 'btnAdicionar' não encontrado no DOM.");
    }
});