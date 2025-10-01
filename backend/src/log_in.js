import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Suas chaves do Supabase (mantenha como está)
const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function logInUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    if(error){
        return { success: false, message: error.message };
    } else{
        return { success: true, user: data.user };
    }
}

async function handleLogIn(email, password) {
    const result = await logInUser(email, password);
    if (result.success) {
        // Redireciona para a página de sucesso
        window.location.href = '../../frontend/pages/instituicao.html';
    } else {
        // Exibe o erro
        alert(`Erro ao logar: ${result.message}`);
    }
}

const logInForm = document.getElementById('login-form');

if (logInForm) {
    logInForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o recarregamento da página
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await handleLogIn(email, password);
    });
}