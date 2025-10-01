import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    const { data, error } = await supabase
        .from('instituicao')
        .select('*');
    if (error) {
        console.error('Erro ao buscar instituições:', error);
        return;
    }
   const institutionList = document.querySelector('.card_container');
    if (institutionList) {
        institutionList.innerHTML = '';
data.forEach(institution => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
        <div class="institution_info">
            <img src="../src/assets/images/icon_institution.png" alt="institution icon">
            <h2 class="institution_name">${institution.nome_instituicao}</h2>
            <button type="button" aria-label="Editar item">
                <img src="/frontend/src/assets/images/pencil.png" alt="">
            </button>
            <button type="button" aria-label="Excluir item">
                <img src="/frontend/src/assets/images/trash.png" alt="">
            </button>
        </div>
        <div class="info">
            <div>
                <img src="../src/assets/images/book.png" alt="book image">
                <p class="courses">Cursos</p>
            </div>
            <p>3</p>
        </div>
        <div class="info">
            <div>
                <img src="/frontend/src/assets/images/people_icon.png" alt="book image">
                <p class="courses">Cursos</p>
            </div>
            <p>75</p>
        </div>
        <button>Gerenciar</button>
    `;

    institutionList.appendChild(card);
});
    }
});

async function recordInstitution(name){
    const { data, error } = await supabase
        .from('instituicao')
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
}