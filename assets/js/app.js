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
    if (!modal) return;
    modal.classList.remove('hidden', 'modal-enter-from');
    // Pequeno delay para garantir que a transição CSS funcione
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
    if (!modal) return;
    modal.classList.add('modal-enter-from');
    if (modal.children[0]) {
        modal.children[0].classList.add('modal-enter-from');
    }
    // Aguarda o fim da transição (200ms) para esconder
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// ==================================================
// LÓGICA DE UI GLOBAL
// ==================================================

/**
 * Atualiza a UI com base no cargo e dados do usuário logado.
 */
function updateUIForRole(user) {
    if (!user) return;

    // --- ATUALIZAÇÃO DA SIDEBAR (DADOS DO USUÁRIO) ---
    const userEmailDisplay = document.getElementById('user-email-display');
    const userAvatarDisplay = document.getElementById('user-avatar-display');
    const userNameDisplay = document.getElementById('user-name-display');

    // Mapeamento de cargos para exibição amigável
    const roleMap = {
        member: 'Membro',
        director: 'Diretor',
        vp: 'Vice-Presidente',
        president: 'Presidente'
    };

    // Atualiza textos e imagem se os elementos existirem
    if (userEmailDisplay) userEmailDisplay.textContent = user.email;
    
    if (userAvatarDisplay) {
        // Usa a foto do Google (photoUrl) ou um placeholder se não tiver
        // Prioriza a foto salva no perfil (photoUrl)
        const photoSrc = user.photoUrl || `https://placehold.co/100x100/a3e635/1f2937?text=${user.name ? user.name.charAt(0).toUpperCase() : 'U'}`;
        userAvatarDisplay.src = photoSrc;
        
        // Adiciona um listener de erro caso a imagem do Google quebre, voltando pro placeholder
        userAvatarDisplay.onerror = function() {
            this.src = `https://placehold.co/100x100/a3e635/1f2937?text=${user.name ? user.name.charAt(0).toUpperCase() : 'U'}`;
        };
    }
    
    if (userNameDisplay) {
        // Mostra "Nome (Cargo)"
        const displayRole = roleMap[user.role] || 'Membro';
        // Pega só o primeiro e último nome para não ficar gigante na sidebar
        const names = user.name ? user.name.split(' ') : ['Usuário'];
        const shortName = names.length > 1 ? `${names[0]} ${names[names.length - 1]}` : names[0];
        userNameDisplay.textContent = `${shortName} (${displayRole})`;
    }

    // --- CONTROLE DE ACESSO (MOSTRAR/ESCONDER MENUS) ---
    const userRole = user.role;
    const userDepartment = user.department;

    document.querySelectorAll('[data-role]').forEach(el => {
        const requiredRoles = el.dataset.role.split(' ');
        const requiredDept = el.dataset.department;

        let hasRoleAccess = false;
        
        // Hierarquia: quanto maior o índice, mais poder
        const roleHierarchy = ['member', 'director', 'vp', 'president'];
        const userLevel = roleHierarchy.indexOf(userRole);

        // Verifica se o usuário tem permissão baseada no cargo
        requiredRoles.forEach(role => {
            if (role === 'all') {
                hasRoleAccess = true;
            } else {
                const requiredLevel = roleHierarchy.indexOf(role);
                if (userLevel >= requiredLevel && requiredLevel !== -1) {
                    hasRoleAccess = true;
                }
            }
        });

        // Verifica se o usuário tem permissão baseada no departamento (se aplicável)
        // VP e Presidente acessam tudo independentemente do departamento
        const hasDeptAccess = !requiredDept || 
                              requiredDept === userDepartment || 
                              userRole === 'vp' || 
                              userRole === 'president';

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
        link.classList.remove('bg-green-600'); // Remove destaque anterior
        
        // Verifica se o href do link corresponde à página atual
        // Ajuste para lidar com caminhos relativos ou absolutos
        const linkHref = link.getAttribute('href').split('/').pop();
        
        if (linkHref === currentPage) {
            link.classList.add('bg-green-600'); // Adiciona destaque
        }
    });
}


/**
 * Verifica aniversariantes do dia e mostra modal.
 */
async function checkBirthdays() {
    // Evita mostrar o modal repetidamente na mesma sessão
    if (sessionStorage.getItem('birthdayModalShown')) {
        return;
    }

    const birthdayModal = document.getElementById('birthday-modal');
    const birthdayMessage = document.getElementById('birthday-message');
    
    if (!birthdayModal || !birthdayMessage) return;

    try {
        const allMembers = await getMembers(); // Busca membros da API
        
        const today = new Date();
        const todayMonth = today.getMonth() + 1; // 0-11 -> 1-12
        const todayDay = today.getDate();
        
        const birthdayMembers = allMembers.filter(member => {
            if (!member.dob || member.status !== 'Ativo') return false;
            
            // Tenta criar data. Se vier string ISO (YYYY-MM-DD), o Date() costuma parsear bem.
            // Cuidado com fusos horários: criar data de string pode subtrair um dia dependendo do browser.
            // Melhor abordagem: dividir a string se for YYYY-MM-DD
            let dobMonth, dobDay;
            
            if (typeof member.dob === 'string' && member.dob.includes('-')) {
                const parts = member.dob.split('-');
                // parts[0] = ano, parts[1] = mes, parts[2] = dia
                dobMonth = parseInt(parts[1], 10);
                dobDay = parseInt(parts[2].substring(0, 2), 10); // substring para garantir caso tenha T...
            } else {
                const dobDate = new Date(member.dob);
                dobMonth = dobDate.getUTCMonth() + 1;
                dobDay = dobDate.getUTCDate();
            }

            return dobMonth === todayMonth && dobDay === todayDay;
        });

        if (birthdayMembers.length > 0) {
            const names = birthdayMembers.map(m => m.name.split(' ')[0]).join(', '); // Só o primeiro nome
            birthdayMessage.textContent = `Hoje é o aniversário de ${names}. Deseje um feliz dia! 🎉`;
            
            if (window.lucide) window.lucide.createIcons();
            
            openModal(birthdayModal);
            sessionStorage.setItem('birthdayModalShown', 'true');
            
            const closeBtn = document.getElementById('close-birthday-modal');
            if(closeBtn) closeBtn.addEventListener('click', () => closeModal(birthdayModal));
        }
    } catch (e) {
        console.warn("Não foi possível verificar aniversários:", e);
    }
}

// ==================================================
// PONTO DE ENTRADA PRINCIPAL
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica autenticação. Se falhar, o próprio checkAuth redireciona.
    if (!checkAuth()) return;

    // 2. Recupera dados do usuário
    const user = getCurrentUser();

    // 3. Inicializa ícones
    if (window.lucide) window.lucide.createIcons();

    // 4. Atualiza a Sidebar com dados reais
    updateUIForRole(user);
    setActiveSidebarLink();

    // 5. Configura Logout
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // 6. Verifica aniversários (apenas no dashboard para não incomodar em toda troca de página)
    if (window.location.pathname.includes('dashboard.html')) {
        checkBirthdays();
    }
});