import { getCurrentUser, checkAuth, logout } from './auth.js';
import { getMembers } from './api.js';

// ==================================================
// FUNÇÕES UTILITÁRIAS GLOBAIS (para Modais)
// ==================================================
/**
 * Abre um modal.
 * @param {HTMLElement} modal - O elemento do modal a ser aberto.
 */
export function openModal(modal) {
    modal.classList.remove('hidden', 'modal-enter-from');
    setTimeout(() => {
        modal.classList.remove('modal-enter-from');
        if (modal.children[0]) {
            modal.children[0].classList.remove('modal-enter-from');
        }
    }, 10);
}

/**
 * Fecha um modal.
 * @param {HTMLElement} modal - O elemento do modal a ser fechado.
 */
export function closeModal(modal) {
    modal.classList.add('modal-enter-from');
    if (modal.children[0]) {
        modal.children[0].classList.add('modal-enter-from');
    }
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// ==================================================
// LÓGICA DE UI GLOBAL
// ==================================================

/**
 * Atualiza a UI com base no cargo do usuário logado (mostra/esconde links e painéis).
 */
function updateUIForRole(user) {
    if (!user) return;

    const userRole = user.role;
    const userDepartment = user.department;
    
    // Atualiza o display do usuário na sidebar
    const userEmailDisplay = document.getElementById('user-email-display');
    const userAvatarDisplay = document.getElementById('user-avatar-display');
    const userNameDisplay = document.getElementById('user-name-display');

    if (userEmailDisplay) userEmailDisplay.textContent = user.email;
    if (userAvatarDisplay) userAvatarDisplay.src = user.photoUrl;
    
    const roleMap = {
        member: 'Membro',
        director: 'Diretor',
        vp: 'Vice-Presidente',
        president: 'Presidente'
    };
    if (userNameDisplay) userNameDisplay.textContent = `${user.name} (${roleMap[userRole] || 'Membro'})`;

    // Lógica para mostrar/esconder elementos por cargo (data-role)
    document.querySelectorAll('[data-role]').forEach(el => {
        const requiredRoles = el.dataset.role.split(' ');
        const requiredDept = el.dataset.department;

        let hasRoleAccess = false;
        const roleHierarchy = ['member', 'director', 'vp', 'president'];
        const userLevel = roleHierarchy.indexOf(userRole);

        requiredRoles.forEach(role => {
            if (role === 'all') {
                hasRoleAccess = true;
            } else {
                const requiredLevel = roleHierarchy.indexOf(role);
                if (userLevel >= requiredLevel) {
                    hasRoleAccess = true;
                }
            }
        });

        const hasDeptAccess = !requiredDept || requiredDept === userDepartment || userRole === 'vp' || userRole === 'president';

        if (hasRoleAccess && hasDeptAccess) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

/**
 * Destaca o link da sidebar correspondente à página atual.
 */
function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split('/').pop(); // ex: "dashboard.html"
    const navLinks = document.querySelectorAll('#sidebar-nav .nav-link');

    navLinks.forEach(link => {
        link.classList.remove('bg-green-600');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('bg-green-600');
        }
    });
}


/**
 * Verifica aniversariantes do dia. (Agora é async)
 */
async function checkBirthdays() {
    if (sessionStorage.getItem('birthdayModalShown')) {
        return;
    }

    const allMembers = await getMembers(); // Busca da API
    const birthdayModal = document.getElementById('birthday-modal');
    const birthdayMessage = document.getElementById('birthday-message');
    
    if (!birthdayModal || !birthdayMessage) return; // Sai se o modal não existir nesta página

    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    
    const birthdayMembers = allMembers.filter(member => {
        if (!member.dob || member.status !== 'Ativo') return false;
        const dob = new Date(member.dob);
        return dob.getUTCMonth() + 1 === todayMonth && dob.getUTCDate() === todayDay;
    });

    if (birthdayMembers.length > 0) {
        const names = birthdayMembers.map(m => m.name.split(' ')[0]).join(', ');
        birthdayMessage.textContent = `Hoje é o aniversário de ${names}. Deseje um feliz dia!`;
        lucide.createIcons();
        openModal(birthdayModal);
        sessionStorage.setItem('birthdayModalShown', 'true');
        
        document.getElementById('close-birthday-modal').addEventListener('click', () => closeModal(birthdayModal));
    }
}

// ==================================================
// PONTO DE ENTRADA PRINCIPAL
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) {
        return; 
    }

    const user = getCurrentUser();
    lucide.createIcons();
    updateUIForRole(user);
    setActiveSidebarLink();

    document.getElementById('logout-button').addEventListener('click', logout);
    
    if (window.location.pathname.includes('dashboard.html')) {
        checkBirthdays(); // Agora é uma chamada async
    }
});