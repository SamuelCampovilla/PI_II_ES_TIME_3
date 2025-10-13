import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';

const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async() =>{
    const params = new URLSearchParams(window.location.search);
    const idInstituicao = params.get('id');
    console.log("ID instituição:", idInstituicao);

    
    const{data, error} = await supabase
        .from('cursos')
        .select('*')
        .eq('id_instituicao', idInstituicao);  
        
        
    if(error){
        console.error('Erro ao buscar cursos:', error);
        return;
    }

    const courseList = document.querySelector('.course_list');

})