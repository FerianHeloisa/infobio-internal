import { getMembers } from './api.js'; // Importa a nova função de API

// --- Funções de Sessão ---
// (Estas funções permanecem as mesmas, pois 'loggedInUser' AINDA usa sessionStorage)

function login(user) {
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
    // Não precisamos mais do initDatabases()
    window.location.href = 'pages/dashboard.html';
}

export function logout() {
    sessionStorage.clear();
    window.location.href = '../index.html';
}

export function getCurrentUser() {
    // Esta é a ÚNICA coisa que o sessionStorage armazena agora
    return JSON.parse(sessionStorage.getItem('loggedInUser'));
}

export function checkAuth() {
    if (!getCurrentUser()) {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// --- Lógica da Página de Login (index.html) ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // A função de submit agora é ASYNC
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const loginError = document.getElementById('login-error');
            const submitButton = loginForm.querySelector('button[type="submit"]');

            submitButton.disabled = true;
            submitButton.textContent = "Verificando...";
            
            try {
                // 1. Busca os membros da API (do Google Sheet)
                const membersDB = await getMembers();
                
                // 2. Procura o usuário
                const user = membersDB.find(m => m.email === email && m.status === 'Ativo');

                if (user) {
                    login(user); // Salva o usuário encontrado na sessão e redireciona
                } else {
                    loginError.textContent = "Usuário não encontrado, inativo ou e-mail inválido.";
                    loginError.classList.remove('hidden');
                    submitButton.disabled = false;
                    submitButton.textContent = "Entrar";
                }
            } catch (error) {
                loginError.textContent = "Erro ao conectar com o servidor. Tente novamente.";
                loginError.classList.remove('hidden');
                submitButton.disabled = false;
                submitButton.textContent = "Entrar";
            }
        });
    }
});