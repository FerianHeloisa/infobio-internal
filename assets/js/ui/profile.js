import { getCurrentUser } from '../auth.js';
import { updateMember } from '../api.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('profile-page')) return;

    let attendanceChartInstance;
    const profileForm = document.getElementById('profile-form');
    const myTasksList = document.getElementById('my-pending-tasks-list');
    
    let loggedInUser = getCurrentUser();

    function renderProfilePage() {
        if (!loggedInUser) return;
        
        // Popula os campos do formulário
        document.getElementById('profile-name').value = loggedInUser.name;
        document.getElementById('profile-dob').value = loggedInUser.dob;
        document.getElementById('profile-photo-url').value = loggedInUser.photoUrl;

        // Renderiza tarefas
        myTasksList.innerHTML = '';
        const pendingTasks = loggedInUser.tasks.filter(t => t.status === 'pending');
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
            myTasksList.innerHTML = '<li class="text-gray-500">Nenhuma tarefa pendente. Bom trabalho!</li>';
        }

        // Renderiza gráfico de presença
        const attendanceCtx = document.getElementById('attendanceChart').getContext('2d');
        const ordinaryAttendance = loggedInUser.attendance['Ordinária'] || [];
        const totalMeetings = ordinaryAttendance.length;
        const presentCount = ordinaryAttendance.filter(Boolean).length;
        const percentage = totalMeetings > 0 ? Math.round((presentCount / totalMeetings) * 100) : 100;

        document.getElementById('attendance-percentage').textContent = `${percentage}%`;
        document.getElementById('attendance-summary').textContent = `${presentCount} de ${totalMeetings} presenças`;
        
        if (attendanceChartInstance) attendanceChartInstance.destroy();
        attendanceChartInstance = new Chart(attendanceCtx, { type: 'doughnut', data: { datasets: [{ data: [presentCount, totalMeetings - presentCount], backgroundColor: ['#16a34a', '#e5e7eb'], borderWidth: 0, borderRadius: 5 }] }, options: { cutout: '80%', plugins: { tooltip: { enabled: false } } } });
    }

    // Listener para salvar o perfil (agora é async)
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Atualiza o objeto 'loggedInUser' localmente
        loggedInUser.name = document.getElementById('profile-name').value;
        loggedInUser.dob = document.getElementById('profile-dob').value;
        loggedInUser.photoUrl = document.getElementById('profile-photo-url').value;

        // 2. Envia o objeto ATUALIZADO para a API
        const response = await updateMember(loggedInUser);

        if (response.success) {
            // 3. Salva a versão atualizada no sessionStorage
            sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));

            // 4. Atualiza a UI global (sidebar)
            document.getElementById('user-name-display').textContent = `${loggedInUser.name} (${loggedInUser.role})`;
            document.getElementById('user-avatar-display').src = loggedInUser.photoUrl;
            
            const successMsg = document.getElementById('profile-save-success');
            successMsg.classList.remove('hidden');
            setTimeout(() => successMsg.classList.add('hidden'), 2000);
        } else {
            alert("Erro ao salvar o perfil. Verifique o console.");
        }
    });
    
    // Listener para completar tarefas (agora é async)
    myTasksList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('complete-task-btn')) {
            const taskName = e.target.dataset.taskName;
            const taskInDB = loggedInUser.tasks.find(t => t.name === taskName);

            if (taskInDB) {
                taskInDB.status = 'completed';
                
                // 1. Envia o objeto ATUALIZADO para a API
                const response = await updateMember(loggedInUser);
                
                if (response.success) {
                    // 2. Salva no sessionStorage
                    sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
                    // 3. Re-renderiza a página
                    renderProfilePage();
                } else {
                    alert("Erro ao completar tarefa.");
                    taskInDB.status = 'pending'; // Reverte a mudança local
                }
            }
        }
    });

    renderProfilePage(); // Renderização inicial
});