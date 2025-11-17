import { getCurrentUser } from '../auth.js';
// Não precisa da API para a lógica de "mostrar/esconder"

document.addEventListener('DOMContentLoaded', () => {
    // Trava de segurança
    if (!document.getElementById('feedback-page')) return;

    const loggedInUser = getCurrentUser();

    function renderFeedbackPage() {
        const userRole = loggedInUser.role;
        const userDepartment = loggedInUser.department;
        const formView = document.getElementById('feedback-form-view');
        const presidentView = document.getElementById('feedback-president-view');

        formView.classList.add('hidden');
        presidentView.classList.add('hidden');

        // Presidente, VP e Diretor de GG veem o painel completo
        if (userRole === 'president' || userRole === 'vp' || (userRole === 'director' && userDepartment === 'Gente & Gestão')) {
            presidentView.classList.remove('hidden');
        } else {
            // Outros membros veem o formulário
            formView.classList.remove('hidden');
        }
    }

    // Listener para o formulário de envio (simulação)
    document.getElementById('feedback-form').addEventListener('submit', (e) => {
        e.preventDefault();

        // Aqui você chamaria a API (ex: await addFeedback(...))

        // Por enquanto, apenas mostramos a mensagem de sucesso
        const successMsg = document.getElementById('feedback-success');
        successMsg.classList.remove('hidden');
        setTimeout(() => successMsg.classList.add('hidden'), 2000);
        e.target.reset();
    });

    renderFeedbackPage();
});