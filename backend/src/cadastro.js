import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    const { data, error } = await supabase
        .from('Instituicao')
        .select('*');
    if (error) {
        console.error('Erro ao buscar instituições:', error);
        return;
    }
   const institutionList = document.querySelector('.card_container');
    if (institutionList) {
        institutionList.innerHTML = '';
    data.forEach( async institution => {
        const { data: cursos, error } = await supabase
    .from('Cursos')
    .select('id_curso')
    .eq('id_instituicao', institution.id_instituicao);

    const cursosCount = cursos ? cursos.length : 0;
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
        <div class="institution_info">
            <img src="../src/assets/images/icon_institution.png" alt="institution icon">
            <h2 class="institution_name">${institution.nome_instituicao}</h2>
            <button type="button" aria-label="Editar item">
                <img src="/frontend/src/assets/images/pencil.png" alt="">
            </button>
            <button class = "btnExcluir" data-id="${institution.id_instituicao}" type="button" aria-label="Excluir item">
                <img src="/frontend/src/assets/images/trash.png" alt="">
            </button>
        </div>
        <div class="info">
            <div>
                <img src="../src/assets/images/book.png" alt="book image">
                <p class="courses">Cursos</p>
            </div>
            <p>${cursosCount}</p>
        </div>
        <button class = "btnGerenciar" data-id="${institution.id_instituicao}">Gerenciar</button>
    `;

    institutionList.appendChild(card); 
    const btnExcluir = card.querySelector('.btnExcluir');
if (btnExcluir) {
    btnExcluir.addEventListener('click', async () => {
        const id = btnExcluir.getAttribute('data-id');
        const { error } = await supabase
            .from('Instituicao')
            .delete()
            .eq('id_instituicao', id);
        if (error) {
            alert('Erro ao excluir instituição: ' + error.message);
        } else {
            card.remove(); // Remove o card da tela
        }
    });
}
    const btnGerenciar = card.querySelector('.btnGerenciar');
    if (btnGerenciar) {
        btnGerenciar.addEventListener('click', () => {
            const id = btnGerenciar.getAttribute('data-id');
            window.location.href = `../../frontend/pages/menagementPage.html?id=${id}`;
        }
        );
    }
});
    }
});

async function recordInstitution(name){
    const { data, error } = await supabase
        .from('Instituicao')
        .insert([{ nome_instituicao: name }]);

    if (error) {
        console.error('Erro ao adicionar instituição:', error);
        return { success: false, message: error.message };
    } else {
        console.log('Instituição adicionada com sucesso:', data);
        return { success: true, institution: data };
    }
}

const btnAdd = document.getElementById('btnAdicionar');

if(btnAdd){
    btnAdd.addEventListener('click', async (event) => {
        const instituicao = document.getElementById('institution-name').value;
        if(!instituicao.trim()){
            alert('Por favor, insira o nome da instituição.');
            return;
        }
        event.preventDefault();
        await recordInstitution(instituicao);
        location.reload();
    });

    const btnSair = document.getElementById('btnSair');
    btnSair.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = '../../frontend/src/index.html';
    });
}


