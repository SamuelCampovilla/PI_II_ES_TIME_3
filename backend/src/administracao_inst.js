import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    // Buscar dados da instituição
    const { data: instituicao, error } = await supabase
        .from('instituicao')
        .select('*')
        .eq('id_instituicao', id)
        .single();

    if (error || !instituicao) {
        alert('Instituição não encontrada');
        return;
    }

    const btnAddCurso = document.getElementById('add-course');
    if (btnAddCurso) {
        //ADICIONAR EVENT LISTENER PARA BOTÃO DE ADICIONAR CURSO
    }

    // Exibir nome da instituição
    const nomeEl = document.getElementById('nome_instituicao');
    if (nomeEl) {
        nomeEl.textContent = instituicao.nome_instituicao;
    }

    // Buscar cursos da instituição
    const { data: cursos, error: errorCursos } = await supabase
        .from('cursos')
        .select('*')
        .eq('id_instituicao', id);

    const cursosEl = document.getElementById('lista_cursos');
    if (cursosEl && cursos) {
        cursosEl.innerHTML = '';
        cursos.forEach(curso => {
            const div = document.createElement('div');
            div.className = 'course';
            div.innerHTML = `
                <div class="course-header">
                    <span class="nome_curso"><img src="/frontend/src/assets/images/book.png" alt=""> ${curso.nome_curso}</span>
                    <div class="btn-group">
                        <button class="btn btn-primary">+ Nova Disciplina</button>
                        <button class="btnEditarCurso btn-icon" title="Editar Curso"><img src="/frontend/src/assets/images/pencil.png" alt=""></button>
                        <button class="btnExcluirCurso btn-icon" title="Excluir Curso"><img src="/frontend/src/assets/images/trash.png" alt=""></button>
                    </div>
                </div>
                <div class="disciplines"></div>
            `;
            cursosEl.appendChild(div);

            // Listener para exclusão do curso
            const btnExcluirCurso = div.querySelector('.btnExcluirCurso');
            if (btnExcluirCurso) {
                btnExcluirCurso.addEventListener('click', async () => {
                    const confirmDelete = confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.');
                    if (confirmDelete) {
                        const { error: deleteError } = await supabase
                            .from('cursos')
                            .delete()
                            .eq('id_curso', curso.id_curso);
                        if (deleteError) {
                            alert('Erro ao excluir curso: ' + deleteError.message);
                        } else {
                            alert('Curso excluído com sucesso!');
                            div.remove();
                        }
                    }
                });
            }

            // Buscar disciplinas do curso e adicionar dinamicamente
            supabase
                .from('disciplinas')
                .select('*')
                .eq('id_curso', curso.id_curso)
                .then(({ data: disciplinas }) => {
                    const disciplinesDiv = div.querySelector('.disciplines');
                    if (disciplinas && disciplinas.length > 0) {
                        disciplinas.forEach(disciplina => {
                            const discDiv = document.createElement('div');
                            discDiv.className = 'discipline';
                            discDiv.innerHTML = `
                                <div class="discipline-header">
                                    <span>${disciplina.nome_disciplina}</span>
                                    <div class="btn-group">
                                        <button class="btn-icon" title="Editar Disciplina"><img src="/frontend/src/assets/images/pencil.png" alt=""></button>
                                        <button class="btn-icon" title="Excluir Disciplina"><img src="/frontend/src/assets/images/trash.png" alt=""></button>
                                    </div>
                                </div>
                                <div class="discipline-subheader">
                                    Código: ${disciplina.codigo_disciplina} &nbsp;&nbsp; Período: ${disciplina.periodo}
                                </div>
                            `;
                            disciplinesDiv.appendChild(discDiv);
                        });
                    }
                });
        });
    }
});