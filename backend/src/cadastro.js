import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idDocente = params.get('id');
    console.log("ID Docente:", idDocente);
    const welcomeEl = document.getElementById('welcome');
    const profNameEl = document.getElementById('prof_name');
    const { data: docente, error: docenteError } = await supabase
        .from('docente')
        .select('nome')
        .eq('id_docente', idDocente)
        .single();
    if (docenteError) {
        console.error('Erro ao buscar nome do docente:', docenteError);
    } else if (welcomeEl && docente) {
        welcomeEl.textContent = `Bem-vindo, ${docente.nome}!`;
        profNameEl.textContent = `Prof. ${docente.nome}`;
    }
        const nome_professor = document.getElementById('nome_professor');
    if (nome_professor && docente) {
        nome_professor.textContent = 'Prof. ' + docente.nome;
    }

    if (!idDocente) return;

    // Buscar instituições vinculadas
    const { data, error } = await supabase
        .from('docente_instituicao')
        .select(`
            instituicao (
                id_instituicao,
                nome_instituicao
            )
        `)
        .eq('id_docente', idDocente);

    if (error) {
        console.error('Erro ao buscar instituições:', error);
        return;
    }

    const institutionList = document.querySelector('.card_container');
    if (institutionList) {
        institutionList.innerHTML = '';

        data.forEach(async row => {
            const institution = row.instituicao;

            // Buscar cursos da instituição
            const { data: cursos } = await supabase
                .from('cursos')
                .select('id_curso')
                .eq('id_instituicao', institution.id_instituicao);

            const cursosCount = cursos ? cursos.length : 0;

            // Criar card
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="institution_info">
                    <img src="../src/assets/images/icon_institution.png" alt="institution icon">
                    <h2 class="institution_name">${institution.nome_instituicao}</h2>
                    <button class="btnExcluir" data-id="${institution.id_instituicao}" type="button">
                        <img src="/frontend/src/assets/images/trash.png" alt="Excluir">
                    </button>
                </div>
                <div class="info">
                    <div>
                        <img src="../src/assets/images/book.png" alt="book image">
                        <p class="courses">Cursos</p>
                    </div>
                    <p>${cursosCount}</p>
                </div>
                <button class="btnGerenciar" data-id="${institution.id_instituicao}">Gerenciar</button>
            `;

            institutionList.appendChild(card);

            // Botão excluir
            const btnExcluir = card.querySelector('.btnExcluir');
            btnExcluir.addEventListener('click', async () => {
                const idInstituicao = btnExcluir.getAttribute('data-id');
                const { error } = await supabase
                    .from('docente_instituicao')
                    .delete()
                    .match({ id_docente: idDocente, id_instituicao: idInstituicao });

                if (error) {
                    alert('Erro ao excluir instituição: ' + error.message);
                } else {
                    card.remove();
                }
            });

            // Botão gerenciar
            const btnGerenciar = card.querySelector('.btnGerenciar');
            btnGerenciar.addEventListener('click', () => {
                const id = btnGerenciar.getAttribute('data-id');
                window.location.href = `../../frontend/pages/menagementPage.html?id=${id}`;
            });
        });
    }

    // Botão adicionar
    const btnAdd = document.getElementById('btnAdicionar');
    if (btnAdd) {
        btnAdd.addEventListener('click', async (event) => {
            event.preventDefault();
            const nomeInstituicao = document.getElementById('institution-name').value;
            if (!nomeInstituicao.trim()) {
                alert('Por favor, insira o nome da instituição.');
                return;
            }
            await adicionarVinculoDocenteInstituicao(idDocente, nomeInstituicao);
            location.reload();
        });
    }

    // Botão sair
    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '../../frontend/src/index.html';
        });
    }
});

// Função para adicionar vínculo docente-instituição
async function adicionarVinculoDocenteInstituicao(idDocente, nomeInstituicao) {
    try {
        // Verifica se a instituição já existe
        let { data: instituicao, error: errorSelect } = await supabase
            .from('instituicao')
            .select('*')
            .eq('nome_instituicao', nomeInstituicao)
            .maybeSingle();

        let idInstituicao;

        if (!instituicao) {
            // Se não existir, cria a instituição
            const { data: novaInstituicao, error: errorInsert } = await supabase
                .from('instituicao')
                .insert([{ nome_instituicao: nomeInstituicao }])
                .select()
                .single();

            if (errorInsert) {
                console.error('Erro ao criar instituição:', errorInsert);
                alert('Erro ao criar instituição');
                return;
            }

            idInstituicao = novaInstituicao.id_instituicao;
        } else {
            idInstituicao = instituicao.id_instituicao;
        }

        // Cria o vínculo evitando duplicados
        const { error: errorVinculo } = await supabase
            .from('docente_instituicao')
            .insert([{ id_docente: idDocente, id_instituicao: idInstituicao }], { ignoreDuplicates: true });

        if (errorVinculo) {
            console.error('Erro ao vincular docente à instituição:', errorVinculo);
            alert('Erro ao vincular docente à instituição');
            return;
        }

        alert('Vínculo criado com sucesso!');
    } catch (err) {
        console.error('Erro inesperado:', err);
        alert('Erro inesperado ao criar vínculo');
    }
}
