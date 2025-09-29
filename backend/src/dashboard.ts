import { createClient } from '@supabase/supabase-js';

// Configure Supabase client
const supabaseUrl = 'https://YOUR_SUPABASE_URL.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para buscar dados e criar cards
async function criarCards() {
    // Substitua 'cards' pelo nome da sua tabela
    const { data, error } = await supabase.from('cards').select('*');
    if (error) {
        console.error('Erro ao buscar dados:', error.message);
        return;
    }

    if (!data) {
        console.log('Nenhum dado encontrado.');
        return;
    }

    // Exemplo de criação de cards (console)
    // Seleciona o container onde os cards serão inseridos
    const container = document.getElementById('cards-container');
    if (!container) {
        console.error('Elemento com id "cards-container" não encontrado.');
        return;
    }

    // Limpa o container antes de adicionar novos cards
    container.innerHTML = '';

    data.forEach((item) => {
        // Cria o elemento do card
        const card = document.createElement('div');
        card.className = 'card';

        // Cria o título
        const titulo = document.createElement('h3');
        titulo.textContent = item.titulo;

        // Cria a descrição
        const descricao = document.createElement('p');
        descricao.textContent = item.descricao;

        // Cria a data
        const dataElem = document.createElement('span');
        dataElem.textContent = item.data;

        // Adiciona os elementos ao card
        card.appendChild(titulo);
        card.appendChild(descricao);
        card.appendChild(dataElem);

        // Adiciona o card ao container
        container.appendChild(card);
    });
}

// Chame a função
criarCards();