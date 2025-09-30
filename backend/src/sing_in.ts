import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);


export async function signUpUser(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) {
        return { success: false, message: error.message };
    }
    return { success: true, user: data.user };
}

export async function handleSignUp(email: string, password: string) {
    const result = await signUpUser(email, password);   
    if (result.success) {
        window.location.href = 'instituicao.html';
    } else {
        alert(`Erro ao cadastrar: ${result.message}`);
    }
}


document.getElementById('signup-form')?.addEventListener('singnup_btn', async (event) => {
    event.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    await handleSignUp(email, password);
});