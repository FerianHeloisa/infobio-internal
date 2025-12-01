import { getCurrentUser } from '../auth.js';
import { updateMember, getMembers } from '../api.js';

// Função de inicialização imediata (IIFE)
(async function initProfilePage() {
    // 1. Trava de página (só roda se tiver o elemento)
    if (!document.getElementById('profile-page')) return;

    console.log("🚀 Iniciando Perfil...");

    const profileForm = document.getElementById('profile-form');
    const myTasksList = document.getElementById('my-pending-tasks-list');
    let attendanceChartInstance;
    
    // 2. Pega usuário da sessão (Cache)
    let loggedInUser = getCurrentUser();
    
    if (!loggedInUser) {
        console.error("❌ Erro: Usuário não encontrado na sessão.");
        return;
    }

    // 3. Busca dados frescos da API em background
    try {
        const members = await getMembers();
        if (Array.isArray(members)) {
            const freshUser = members.find(m => m.email === loggedInUser.email);
            if (freshUser) {
                // Preserva a foto do Google se a da planilha estiver vazia
                if (!freshUser.photoUrl && loggedInUser.photoUrl) {
                    freshUser.photoUrl = loggedInUser.photoUrl;
                }
                loggedInUser = freshUser;
                sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
                renderProfilePage(); // Re-renderiza com dados novos
            }
        }
    } catch (e) {
        console.warn("⚠️ Usando cache offline:", e);
    }

    // 4. Renderiza a página
    renderProfilePage();

    function renderProfilePage() {
        // --- Preenche Inputs ---
        const nameInput = document.getElementById('profile-name');
        const dobInput = document.getElementById('profile-dob');
        const photoInput = document.getElementById('profile-photo-url');

        if (nameInput) nameInput.value = loggedInUser.name || '';
        
        // Data (YYYY-MM-DD)
        if (dobInput) {
            let dob = loggedInUser.dob || '';
            if (dob && dob.includes('T')) dob = dob.split('T')[0];
            
            // Converte DD/MM/YYYY para YYYY-MM-DD se necessário
            if (dob.includes('/')) {
                const parts = dob.split('/'); 
                if(parts.length === 3) dob = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            dobInput.value = dob;
        }
        
        // --- FOTO (Bloqueada e Apenas Leitura) ---
        if (photoInput) {
            // Mostra a URL real ou um texto informativo
            photoInput.value = loggedInUser.photoUrl || '';
            photoInput.disabled = true; // Bloqueia edição
            photoInput.classList.add('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
            photoInput.title = "A foto é gerenciada pelo login do Google.";
        }

        // --- Tarefas ---
        if (myTasksList) {
            myTasksList.innerHTML = '';
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
                myTasksList.innerHTML = '<li class="text-gray-500 text-sm">Nenhuma tarefa pendente.</li>';
            }
        }

        // --- Gráfico ---
        const canvas = document.getElementById('attendanceChart');
        if (canvas) {
            const attendanceCtx = canvas.getContext('2d');
            let presentCount = 0;
            let totalMeetings = 0;
            
            try {
                const attObj = typeof loggedInUser.attendance === 'string' ? JSON.parse(loggedInUser.attendance) : (loggedInUser.attendance || {});
                Object.values(attObj).forEach(arr => {
                    if (Array.isArray(arr)) {
                        totalMeetings += arr.length;
                        presentCount += arr.filter(Boolean).length;
                    }
                });
            } catch(e) {}

            if (totalMeetings === 0) totalMeetings = 1; 
            const percentage = Math.round((presentCount / totalMeetings) * 100);

            const pctDisplay = document.getElementById('attendance-percentage');
            const summaryDisplay = document.getElementById('attendance-summary');
            
            if(pctDisplay) pctDisplay.textContent = `${percentage}%`;
            if(summaryDisplay) summaryDisplay.textContent = `${presentCount} presenças`;
            
            if (attendanceChartInstance) attendanceChartInstance.destroy();
            attendanceChartInstance = new Chart(attendanceCtx, { 
                type: 'doughnut', 
                data: { 
                    datasets: [{ 
                        data: [presentCount, totalMeetings - presentCount], 
                        backgroundColor: ['#16a34a', '#e5e7eb'], 
                        borderWidth: 0, 
                        borderRadius: 5 
                    }] 
                }, 
                options: { cutout: '80%', plugins: { tooltip: { enabled: false } } } 
            });
        }
    }

    // --- Salvar Perfil ---
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Salvando...";
            submitBtn.disabled = true;
            
            // 1. Atualiza APENAS Nome e Data (NÃO mexe na foto)
            loggedInUser.name = document.getElementById('profile-name').value;
            loggedInUser.dob = document.getElementById('profile-dob').value;
            
            // A photoUrl continua a que já estava no objeto loggedInUser
            // Se você incluir a linha aqui lendo do input, vai salvar valor errado!

            // 2. Envia para Backend
            const response = await updateMember(loggedInUser);

            if (response.success || response.ok) {
                sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
                
                const successMsg = document.getElementById('profile-save-success');
                if(successMsg) {
                    successMsg.classList.remove('hidden');
                    setTimeout(() => {
                        successMsg.classList.add('hidden');
                        window.location.reload(); // Recarrega para atualizar sidebar
                    }, 1000);
                }
            } else {
                alert("Erro ao salvar: " + (response.error || "Tente novamente."));
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // --- Completar Tarefa ---
    if (myTasksList) {
        myTasksList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('complete-task-btn')) {
                const taskName = e.target.dataset.taskName;
                let tasks = [];
                try {
                    tasks = typeof loggedInUser.tasks === 'string' ? JSON.parse(loggedInUser.tasks) : (loggedInUser.tasks || []);
                } catch(e) { tasks = []; }

                const taskInDB = tasks.find(t => t.name === taskName);

                if (taskInDB) {
                    taskInDB.status = 'completed';
                    loggedInUser.tasks = tasks; // Atualiza objeto
                    
                    e.target.textContent = "Salvando...";
                    
                    const response = await updateMember(loggedInUser);
                    if (response.success || response.ok) {
                        sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
                        renderProfilePage(); 
                    } else {
                        alert("Erro ao completar tarefa.");
                        e.target.textContent = "Concluir";
                    }
                }
            }
        });
    }
})();