/* Samuel Campovilla */
// Aguarda todo o HTML ser carregado antes de rodar o script
document.addEventListener('DOMContentLoaded', () => {

  // Pega o link/botão que abre o modal
  const openBtn = document.getElementById('conditions_popup');

  // Pega o botão que fecha o modal (deve existir no HTML)
  const closeBtn = document.getElementById('close_modal');

  // Pega o elemento do modal (container que cobre a tela)
  const modal   = document.getElementById('terms_modal');

  // Se faltar qualquer um dos elementos, avisa no console e não continua
  if (!openBtn || !closeBtn || !modal) {
    console.warn('Ligação do modal: elemento(s) ausente(s).');
    return;
  }

  // Ao clicar no link "Eu li e aceito...", abre o modal ( mostra o container )
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();               // impede a navegação do <a href="#">
    modal.classList.add('active');    // adiciona a classe que deixa o modal visível
  });

  // Ao clicar no botão "Fechar", fecha o modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active'); // remove a classe e esconde o modal
  });

  // Se clicar fora do cartão (na área escura), também fecha o modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Pressionar a tecla Esc fecha o modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.remove('active');
  });
});
