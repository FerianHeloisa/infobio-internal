import { getCurrentUser } from '../auth.js';
import { getForms, addForm } from '../api.js';

document.addEventListener('DOMContentLoaded', () => {
    // Trava de segurança
    if (!document.getElementById('forms-page')) return;

    const loggedInUser = getCurrentUser();
    const ggView = document.getElementById('forms-gg-view');
    const answerView = document.getElementById('forms-answer-view');
    
    let localFormsDB = []; // Cache local dos formulários

    /**
     * Renderiza a página decidindo qual view mostrar
     */
    function renderFormsPage() {
        const canCreateForms = (loggedInUser.department === 'Gente & Gestão' && loggedInUser.role === 'director') || loggedInUser.role === 'vp' || loggedInUser.role === 'president';
        
        if (canCreateForms) {
            ggView.classList.remove('hidden');
            answerView.classList.add('hidden');
            // Inicializa o container de perguntas com uma pergunta
            const questionsContainer = document.getElementById('questions-container');
            questionsContainer.innerHTML = ''; 
            questionsContainer.appendChild(createQuestionField());
            
            // Renderiza a lista de formulários já enviados (simples)
            const sentList = document.querySelector('#forms-gg-view ul');
            sentList.innerHTML = '';
            localFormsDB.forEach(form => {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between p-4 rounded-lg border border-gray-200';
                li.innerHTML = `
                    <div>
                        <p class="font-semibold text-gray-800">${form.title}</p>
                        <p class="text-sm text-gray-500">Enviado para: ${form.target}</p>
                    </div>
                    <span class="text-sm font-medium">0/0 Respostas</span>
                `; // A contagem de respostas precisaria de outra tabela
                sentList.appendChild(li);
            });

        } else {
            ggView.classList.add('hidden');
            answerView.classList.remove('hidden');
            const formsList = document.getElementById('forms-list-to-answer');
            formsList.innerHTML = '';
            
            const formsForUser = localFormsDB.filter(form => 
                form.target === 'all_members' || 
                (form.target === 'all_directors' && loggedInUser.role !== 'member') || 
                form.target === loggedInUser.department
            );

            if (formsForUser.length > 0) {
                formsForUser.forEach(form => {
                    const li = document.createElement('li');
                    li.className = 'flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50';
                    li.innerHTML = `<div><p class="font-semibold text-gray-800">${form.title}</p><p class="text-sm text-gray-500">Enviado por: Gente & Gestão</p></div><button class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">Responder Agora</button>`;
                    formsList.appendChild(li);
                });
            } else {
                formsList.innerHTML = '<li class="text-gray-500">Nenhum formulário pendente para você.</li>';
            }
        }
    }

    /**
     * Cria um novo campo de input para pergunta
     */
    function createQuestionField(questionText = '') {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2 question-field';
        div.innerHTML = `<input type="text" name="question" value="${questionText}" placeholder="Digite sua pergunta aqui..." required class="flex-grow shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"><button type="button" class="remove-question-button text-gray-400 hover:text-red-600 p-1"><i data-lucide="x-circle" class="w-5 h-5 pointer-events-none"></i></button>`;
        lucide.createIcons({ nodes: [div.querySelector('.remove-question-button i')] });
        return div;
    }

    // --- Listeners para a view de GG ---
    document.getElementById('add-question-button').addEventListener('click', () => {
        document.getElementById('questions-container').appendChild(createQuestionField());
    });

    document.getElementById('questions-container').addEventListener('click', (e) => {
        const removeButton = e.target.closest('.remove-question-button');
        if (removeButton && document.getElementById('questions-container').querySelectorAll('.question-field').length > 1) {
            removeButton.parentElement.remove();
        }
    });

    // Listener para CRIAR o formulário (agora é async)
    document.getElementById('create-form-gg').addEventListener('submit', async (e) => { 
        e.preventDefault(); 
        const title = document.getElementById('form-title').value;
        const target = document.getElementById('form-target').value;
        
        // Pega o ID mais alto e soma 1
        const newId = localFormsDB.length > 0 ? Math.max(...localFormsDB.map(f => f.id)) + 1 : 1;
        
        const newForm = {
            id: newId,
            title: title,
            target: target
            // NOTA: O protótipo não salva as perguntas, apenas o título.
        };
        
        const response = await addForm(newForm);

        if (response.success) {
            localFormsDB.push(newForm); // Adiciona ao cache local
            
            const successMsg = document.getElementById('create-form-success');
            successMsg.classList.remove('hidden');
            setTimeout(() => successMsg.classList.add('hidden'), 2000);
            
            e.target.reset();
            document.getElementById('questions-container').innerHTML = '';
            document.getElementById('questions-container').appendChild(createQuestionField());
            
            renderFormsPage(); // Re-renderiza a lista de "enviados"
        } else {
            alert("Erro ao criar formulário.");
        }
    });

    /**
     * Função de inicialização da página
     */
    async function initFormsPage() {
        localFormsDB = await getForms(); // Busca os dados uma vez
        renderFormsPage(); // Renderiza com os dados em cache
    }

    initFormsPage();
});