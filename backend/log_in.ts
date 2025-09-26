import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function loginUser(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, user: data.user, session: data.session };
}
export async function handleLogin(email: string, password: string) {
    const result = await loginUser(email, password);

    if (result.success) {
        window.location.href = 'instituicao.html';
    } else {
        alert(`Erro ao fazer login: ${result.message}`);
    }
}

document.getElementById('login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    await handleLogin(email, password);
});