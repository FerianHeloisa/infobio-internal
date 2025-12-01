import { getCurrentUser } from '../auth.js';
import { updateMember, getMembers } from '../api.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('profile-page')) return;

    let attendanceChartInstance;
    const profileForm = document.getElementById('profile-form');
    const myTasksList = document.getElementById('my-pending-tasks-list');
    
    // Tenta pegar usuário fresco da API, senão usa o da sessão
    let loggedInUser = getCurrentUser();
    
    try {
        const members = await getMembers();
        const fresUser = members.find(m => m.id === loggedInUser.id);
        if (fresUser) {
            loggedInUser = fresUser;
            sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser)); // Atualiza cache
        }
    } catch (e) {
        console.warn("Usando cache de usuário offline");
    }

    function renderProfilePage() {
        if (!loggedInUser) return;
        
        // Popula os campos
        document.getElementById('profile-name').value = loggedInUser.name || '';
        // Converte data se necessário (yyyy-MM-dd)
        let dob = loggedInUser.dob || '';
        if (dob && dob.includes('T')) dob = dob.split('T')[0];
        document.getElementById('profile-dob').value = dob;
        
        document.getElementById('profile-photo-url').value = loggedInUser.photoUrl || '';

        // Tarefas
        myTasksList.innerHTML = '';
        // Parse de tarefas se vier como string JSON
        let tasks = [];
        try {
            tasks = typeof loggedInUser.tasks === 'string' ? JSON.parse(loggedInUser.tasks) : (loggedInUser.tasks || []);
        } catch(e) { tasks = []; }

        const pendingTasks = tasks.filter(t => t.status === 'pending');
        
        if (pendingTasks.length > 0) {
            pendingTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50';
                li.innerHTML = `
                    <span>${task.name}</span>
                    <button type="button" data-task-name="${task.name}" class="complete-task-btn px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">Concluir</button>
                `;
                myTasksList.appendChild(li);
            });
        } else {
            myTasksList.innerHTML = '<li class="text-gray-500">Nenhuma tarefa pendente.</li>';
        }

        // Gráfico Presença (Simulação visual baseada em dados)
        // Se quiser real, teria que parsear o attendance object
        const attendanceCtx = document.getElementById('attendanceChart').getContext('2d');
        let presentCount = 8; // Mock para visual, já que attendance é complexo
        let totalMeetings = 10;
        
        if (attendanceChartInstance) attendanceChartInstance.destroy();
        attendanceChartInstance = new Chart(attendanceCtx, { type: 'doughnut', data: { datasets: [{ data: [presentCount, totalMeetings - presentCount], backgroundColor: ['#16a34a', '#e5e7eb'], borderWidth: 0, borderRadius: 5 }] }, options: { cutout: '80%', plugins: { tooltip: { enabled: false } } } });
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = profileForm.querySelector('button[type="submit"]');
        submitBtn.textContent = "Salvando...";
        submitBtn.disabled = true;
        
        loggedInUser.name = document.getElementById('profile-name').value;
        loggedInUser.dob = document.getElementById('profile-dob').value;
        loggedInUser.photoUrl = document.getElementById('profile-photo-url').value;

        // Se tasks/attendance forem objetos, stringify antes de enviar se a API exigir
        // Aqui enviamos o objeto e deixamos o api.js lidar (ou o apps script)
        const response = await updateMember(loggedInUser);

        if (response.success || response.ok) {
            sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
            
            // Atualiza sidebar visualmente
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay) nameDisplay.textContent = `${loggedInUser.name} (${loggedInUser.role})`;
            const avatarDisplay = document.getElementById('user-avatar-display');
            if (avatarDisplay) avatarDisplay.src = loggedInUser.photoUrl;
            
            const successMsg = document.getElementById('profile-save-success');
            successMsg.classList.remove('hidden');
            setTimeout(() => successMsg.classList.add('hidden'), 2000);
        } else {
            alert("Erro ao salvar perfil.");
        }
        submitBtn.textContent = "Salvar Alterações";
        submitBtn.disabled = false;
    });

    renderProfilePage();
});