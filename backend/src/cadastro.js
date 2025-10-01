import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    });
}