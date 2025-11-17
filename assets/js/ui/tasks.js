import { getCurrentUser } from '../auth.js';
// Não precisa da API pois as tarefas estão no objeto do usuário

document.addEventListener('DOMContentLoaded', () => {
    // Trava de segurança
    if (!document.getElementById('tasks-page')) return;
    
    const loggedInUser = getCurrentUser();
    const tasksListContainer = document.querySelector('#tasks-page div:first-child ul'); // O primeiro <ul>

    function renderTasksPage() {
        tasksListContainer.innerHTML = '';
        
        // Usamos as tarefas do usuário logado
        const activeTasks = loggedInUser.tasks.filter(t => t.status === 'pending');
        
        if (activeTasks.length > 0) {
            activeTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50';
                li.innerHTML = `
                    <div>
                        <p class="font-semibold text-gray-800">${task.name}</p>
                        <p class="text-sm text-gray-500">Projeto: Vida Saudável - Prazo: 25/10/2025</p>
                    </div>
                    <span class="text-sm font-medium text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">Em Andamento</span>
                `;
                tasksListContainer.appendChild(li);
            });
        } else {
            tasksListContainer.innerHTML = '<li class="text-gray-500">Nenhuma tarefa ativa encontrada.</li>';
        }

        // A parte de "Andamento dos Projetos" é estática no HTML e não precisa de JS
    }

    renderTasksPage();
});