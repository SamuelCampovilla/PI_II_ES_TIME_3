// 1. Importe o createClient do Supabase a partir de um link CDN (não use 'require')
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Suas chaves do Supabase (mantenha como está)
const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

// A sintaxe async/await pode ser usada diretamente em navegadores modernos
async function signUpUser(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        return { success: false, message: error.message };
    }
    return { success: true, user: data.user };
}

async function handleSignUp(email, password) {
    const result = await signUpUser(email, password);
    if (result.success) {
        // Redireciona para a página de sucesso
        window.location.href = '../../frontend/pages/instituicao.html';
    } else {
        // Exibe o erro
        alert(`Erro ao cadastrar: ${result.message}`);
    }
}

// 2. Adicione o listener de evento ao formulário
const signUpForm = document.getElementById('signup-form');

if (signUpForm) {
    // 3. O evento correto para um formulário é 'submit', não o nome do botão
    signUpForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o recarregamento da página

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        await handleSignUp(email, password);
    });
}