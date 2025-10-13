// 1. Importe o createClient do Supabase a partir de um link CDN (não use 'require')
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Suas chaves do Supabase (mantenha como está)
const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODczNzAyMCwiZXhwIjoyMDc0MzEzMDIwfQ.jJc4cLbeJDT0uGUkY_UbP17_4hAw4DcUMeKjfhU4O_o';
const supabase = createClient(supabaseUrl, supabaseKey);

// A sintaxe async/await pode ser usada diretamente em navegadores modernos
async function signUpUser(email, password, name, phone) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        email_confirm: true,
            user_metadata: {
                nome: name,
                telefone: phone
            }
    });

    if (error) {
        return { success: false, message: error.message };
    }
    return { success: true, user: data.user };
}

async function handleSignUp(email, password, name, phone) {
    const result = await signUpUser(email, password, name, phone);
    if (result.success) {
        const userId = result.user.id;

        const { error } = await supabase
            .from('docente')
            .insert([{ id_docente: userId, nome: name, email: email,  senha: password, telefone: phone}]);
            window.location.href = '../../frontend/pages/instituicao.html?id=' + userId;
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
        const name = document.getElementById('name').value;
        const phone = document.getElementById('telephone').value;

        const btnAceito = document.getElementById('conditions');
        if (!btnAceito.checked) {
            alert('Você deve aceitar os termos e condições para se cadastrar.');
            return;
        }
        
        await handleSignUp(email, password, name, phone);
    });
}