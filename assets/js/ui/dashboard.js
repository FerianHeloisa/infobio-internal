import { getMembers, getForms } from '../api.js';
import { getCurrentUser } from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('dashboard-page')) return;
    
    // A função init agora é async para aguardar os dados
    async function initDashboard() {
        const loggedInUser = getCurrentUser();
        
        // 1. Busca os dados da API em paralelo
        const [membersDB, formsDB] = await Promise.all([
            getMembers(),
            getForms()
        ]);

        // 2. Atualiza os KPIs
        const activeMembersCount = membersDB.filter(m => m.status === 'Ativo').length;
        document.getElementById('active-members-kpi').textContent = activeMembersCount;
        
        const formsForUser = formsDB.filter(form => 
            form.target === 'all_members' || 
            (form.target === 'all_directors' && loggedInUser.role !== 'member') || 
            form.target === loggedInUser.department
        );
        document.getElementById('pending-forms-kpi').textContent = formsForUser.length;

        // 3. Renderiza os gráficos
        const projectCtx = document.getElementById('projectStatusChart')?.getContext('2d');
        if (projectCtx) {
            new Chart(projectCtx, { /* ... (código do gráfico idêntico) ... */ });
        }

        const membersCtx = document.getElementById('membersChart')?.getContext('2d');
        if (membersCtx) {
            const departmentCounts = membersDB.filter(m => m.status === 'Ativo').reduce((acc, member) => {
                acc[member.department] = (acc[member.department] || 0) + 1;
                return acc;
            }, {});
            new Chart(membersCtx, { /* ... (código do gráfico idêntico) ... */ });
        }
    }

    initDashboard();
});