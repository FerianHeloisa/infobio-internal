import { getMembers, getVacations, getForms } from '../api.js';
import { getCurrentUser } from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('dashboard-page')) return;

    async function initDashboard() {
        const user = getCurrentUser();

        // Carregar dados do BD
        const members = await getMembers();
        const vacations = await getVacations();
        const forms = await getForms();

        // KPI 1 — Membros ativos
        const activeMembers = members.filter(m => m.status === "Ativo").length;
        document.getElementById('active-members-kpi').textContent = activeMembers;

        // KPI 2 — Férias pendentes (Diretor, VP, Presidente)
        const pendingVac = vacations.filter(v => v.status === "Pendente").length;
        const pendingVacKpi = document.getElementById('pending-vacations-kpi');
        if (pendingVacKpi) pendingVacKpi.textContent = pendingVac;

        // KPI 3 — Formulários pendentes (membro)
        const formsForUser = forms.filter(f => 
            f.status === "Ativo" &&
            (f.target === "all_members" || f.target === user.department)
        );
        const pendingForms = document.getElementById('pending-forms-kpi');
        if (pendingForms) pendingForms.textContent = formsForUser.length;

        // KPI 4 — Férias agendadas do membro
        const myFuture = vacations.filter(v => 
            v.email === user.email && v.status === "Aprovado"
        ).length;
        const scheduled = document.getElementById('scheduled-vacations-kpi');
        if (scheduled) scheduled.textContent = myFuture;

        // Receita — você decide depois se vem de forms, sheet ou manual
        const revenueBox = document.getElementById('revenue-kpi');
        if (revenueBox) revenueBox.textContent = "—";
    }

    initDashboard();
});
