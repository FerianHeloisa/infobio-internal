import { getMembers } from './api.js'; // Continua usando a API para buscar membros

// =========================
//   CONTROLE DE SESSÃO
// =========================

function login(user) {
    // Salva o usuário logado na sessão
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
    // Redireciona para o dashboard (modelo “várias páginas”)
    window.location.href = 'pages/dashboard.html';
}

export function logout() {
    sessionStorage.clear();
    // Volta para a tela de login
    window.location.href = '../index.html';
}

export function getCurrentUser() {
    const raw = sessionStorage.getItem('loggedInUser');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function checkAuth() {
    if (!getCurrentUser()) {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// =========================
//   GOOGLE LOGIN HELPERS
// =========================

// Coloca aqui o CLIENT_ID que você criou no Google Cloud
const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';

// Se quiser limitar domínio:
const ALLOWED_DOMAINS = ['infobiojr.com.br', 'usp.br'];

// Decodifica o JWT que o Google retorna
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
}

// Callback chamado pelo Google quando a pessoa faz login
async function handleGoogleCredentialResponse(response) {
    const errorEl = document.getElementById('login-error');

    // Garante que a mensagem de erro some ao tentar de novo
    if (errorEl) {
        errorEl.classList.add('hidden');
    }

    try {
        const data = parseJwt(response.credential);
        const email = (data.email || '').toLowerCase();
        const name = data.name || '';
        const picture = data.picture || '';
        const emailVerified = data.email_verified;

        if (!email || !emailVerified) {
            if (errorEl) {
                errorEl.textContent = 'Seu e-mail Google não está verificado.';
                errorEl.classList.remove('hidden');
            }
            return;
        }

        const domain = email.split('@')[1];
        if (ALLOWED_DOMAINS.length && !ALLOWED_DOMAINS.includes(domain)) {
            if (errorEl) {
                errorEl.textContent = 'Este domínio de e-mail não está autorizado.';
                errorEl.classList.remove('hidden');
            }
            return;
        }

        // 1) Busca todos os membros na API
        const membersDB = await getMembers();

        // 2) Procura o usuário na planilha (email + status Ativo)
        const user = membersDB.find(
            m =>
                String(m.email || '').toLowerCase() === email &&
                String(m.status || '').toLowerCase() === 'ativo'
        );

        if (!user) {
            if (errorEl) {
                errorEl.textContent = 'Você não está cadastrado(a) como membro ativo.';
                errorEl.classList.remove('hidden');
            }
            return;
        }

        // 3) Monta o objeto de usuário que vamos guardar na sessão
        const sessionUser = {
            id: user.id,
            name: user.name || name,
            email: user.email || email,
            department: user.department || '',
            role: user.role || 'member',
            status: user.status || 'Ativo',
            photoUrl: user.photoUrl || picture
        };

        // 4) Faz login “de verdade” (salva na sessão e redireciona)
        login(sessionUser);

    } catch (err) {
        console.error('Erro no login com Google:', err);
        if (errorEl) {
            errorEl.textContent = 'Ocorreu um erro ao fazer login. Tente novamente.';
            errorEl.classList.remove('hidden');
        }
    }
}

// Deixa a função acessível pro Google (se ele precisar encontrá-la no escopo global)
window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;

// =========================
//   INICIALIZAÇÃO NA TELA
// =========================

document.addEventListener('DOMContentLoaded', () => {
    // Se já tiver usuário logado e estiver no index, pula direto para o dashboard
    const current = getCurrentUser();
    if (current && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'pages/dashboard.html';
        return;
    }

    // Inicializa ícones (como você já fazia)
    if (window.lucide) {
        lucide.createIcons();
    }

    // Inicializa o botão de login do Google
    const googleButtonContainer = document.getElementById('google-login-button');

    if (googleButtonContainer && window.google && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(googleButtonContainer, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: '300'
        });
    }
});
