import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


const supabaseUrl = 'https://ncordpjdmjxjxadnfeyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb3JkcGpkbWp4anhhZG5mZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzcwMjAsImV4cCI6MjA3NDMxMzAyMH0.krfcElHajJjdXBHplAPACaHnrSz3RMlVydw_Pa9rrsY';
const supabase = createClient(supabaseUrl, supabaseKey);

const form = document.getElementById('update-password-form');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;

  messageEl.textContent = '';

  const { data, error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    messageEl.textContent = 'Erro ao enviar email de recuperação: ' + error.message;
    messageEl.style.color = 'red';
  } else {
    messageEl.textContent = 'Email de recuperação enviado!';
    messageEl.style.color = 'green';
    form.reset();
  }
});