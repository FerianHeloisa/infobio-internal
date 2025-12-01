import { getMembers, getVacations, getForms } from '../api.js';
import { getCurrentUser } from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('dashboard-page')) return;

    async function initDashboard() {
        const user = getCurrentUser();
        
        // Elementos de loading (opcional, mas recomendado)
        document.getElementById('active-members-kpi').textContent = "...";

        try {
            // Carregar dados reais
            const [members, vacations, forms] = await Promise.all([
                getMembers(),
                getVacations(),
                getForms()
            ]);

            // Validação de arrays (caso a API falhe e retorne undefined)
            const safeMembers = Array.isArray(members) ? members : [];
            const safeVacations = Array.isArray(vacations) ? vacations : [];
            const safeForms = Array.isArray(forms) ? forms : [];

            // KPI 1 — Membros ativos
            const activeMembers = safeMembers.filter(m => m.status === "Ativo").length;
            document.getElementById('active-members-kpi').textContent = activeMembers;

            // KPI 2 — Férias pendentes
            const pendingVac = safeVacations.filter(v => v.status === "Pendente").length;
            const pendingVacKpi = document.getElementById('pending-vacations-kpi');
            if (pendingVacKpi) pendingVacKpi.textContent = pendingVac;

            // KPI 3 — Formulários pendentes
            const formsForUser = safeForms.filter(f => 
                f.status === "Ativo" &&
                (f.target === "all_members" || f.target === user.department)
            );
            const pendingForms = document.getElementById('pending-forms-kpi');
            if (pendingForms) pendingForms.textContent = formsForUser.length;

            // KPI 4 — Férias agendadas do usuário
            const myFuture = safeVacations.filter(v => 
                v.email === user.email && v.status === "Aprovado"
            ).length;
            const scheduled = document.getElementById('scheduled-vacations-kpi');
            if (scheduled) scheduled.textContent = myFuture;

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            document.getElementById('active-members-kpi').textContent = "-";
        }
    }

    initDashboard();
});