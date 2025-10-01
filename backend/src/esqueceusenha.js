import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

const form = document.getElementById('update-password-form');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const newPassword = document.getElementById('new-password').value;
  
  // Limpa mensagens antigas
  messageEl.textContent = '';
  
  // A função updateUser é usada para alterar dados do usuário autenticado,
  // incluindo a senha.
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.error('Erro ao atualizar a senha:', error.message);
    messageEl.textContent = 'Erro ao atualizar a senha: ' + error.message;
    messageEl.style.color = 'red';
  } else {
    console.log('Senha atualizada com sucesso!', data);
    messageEl.textContent = 'Senha atualizada com sucesso!';
    messageEl.style.color = 'green';
    form.reset();
  }
});