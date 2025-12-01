import { getMembers, addMember, updateMember } from '../api.js';
import { openModal, closeModal } from '../app.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('members-page')) return;

    const membersTableBody = document.getElementById('members-table-body');
    const memberFilters = document.getElementById('member-filters');
    const statusColors = { 
        'Ativo': 'bg-green-100 text-green-800', 
        'Afastado': 'bg-yellow-100 text-yellow-800', 
        'Desligado': 'bg-gray-100 text-gray-800' 
    };
    
    let localMembersDB = []; 

    // --- Renderização Inicial (Busca da API) ---
    async function initMembersPage() {
        membersTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Carregando membros do banco de dados...</td></tr>';
        
        try {
            // BUSCA REAL DA API
            const result = await getMembers();
            
            // Garante que é um array
            localMembersDB = Array.isArray(result) ? result : [];

            if (localMembersDB.length === 0) {
                membersTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Nenhum membro encontrado na planilha.</td></tr>';
            } else {
                renderMembersPage('Ativo'); 
            }
        } catch (error) {
            console.error(error);
            membersTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Erro ao carregar membros. Verifique a conexão.</td></tr>';
        }
    }

    function renderMembersPage(filter = 'Ativo') {
        membersTableBody.innerHTML = '';
        
        const filteredMembers = localMembersDB.filter(member => {
            if (filter === 'Todos') return true;
            return (member.status || '').toLowerCase() === filter.toLowerCase();
        });

        if (filteredMembers.length === 0) {
            membersTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">Nenhum membro encontrado com este status.</td></tr>`;
            return;
        }

        filteredMembers.forEach(member => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';
            
            const photo = member.photoUrl || `https://placehold.co/100x100/a3e635/1f2937?text=${(member.name || 'U').charAt(0)}`;
            const roleDisplay = {member: 'Membro', director: 'Diretor', vp: 'Vice-Presidente', president: 'Presidente'}[member.role] || member.role;
            const statusClass = statusColors[member.status] || 'bg-gray-100 text-gray-800';

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full object-cover" src="${photo}" alt="">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${member.name}</div>
                            <div class="text-sm text-gray-500">${member.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.department}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${roleDisplay}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${member.status}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-green-600 hover:text-green-900 edit-member-button" data-member-id="${member.id}">Editar</button>
                </td>
            `;
            membersTableBody.appendChild(tr);
        });
    }
    
    // Listeners de Filtro
    memberFilters.addEventListener('click', (e) => {
        if(e.target.classList.contains('filter-button')) {
            memberFilters.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderMembersPage(e.target.dataset.filter);
        }
    });

    // Listener de Editar
    membersTableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-member-button');
        if(editButton) {
            const memberId = parseInt(editButton.dataset.memberId);
            openEditMemberModal(memberId);
        }
    });

    // --- Modal Adicionar ---
    const addMemberModal = document.getElementById('add-member-modal');
    const addMemberForm = document.getElementById('add-member-form');
    
    if(document.getElementById('add-member-button')) {
        document.getElementById('add-member-button').addEventListener('click', () => openModal(addMemberModal));
    }
    if(document.getElementById('close-add-member-modal-button')) {
        document.getElementById('close-add-member-modal-button').addEventListener('click', () => closeModal(addMemberModal));
    }
    if(document.getElementById('cancel-add-member-button')) {
        document.getElementById('cancel-add-member-button').addEventListener('click', () => closeModal(addMemberModal));
    }
    
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = addMemberForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Salvando...";
            submitBtn.disabled = true;

            const name = document.getElementById('new-member-name').value;
            // Gera um ID temporário se não houver lógica no backend para ID automático
            const newId = localMembersDB.length > 0 ? Math.max(...localMembersDB.map(m => m.id)) + 1 : 1;
            
            const newMember = {
                id: newId,
                name: name,
                email: document.getElementById('new-member-email').value,
                department: document.getElementById('new-member-department').value,
                role: document.getElementById('new-member-role').value,
                status: document.getElementById('new-member-status').value,
                photoUrl: `https://placehold.co/100x100/a3e635/1f2937?text=${name.charAt(0).toUpperCase()}`,
                dob: "", 
                tasks: "[]",
                attendance: "{}"
            };
            
            const response = await addMember(newMember);
            
            if (response.success || response.ok) {
                newMember.tasks = [];
                newMember.attendance = {};
                localMembersDB.push(newMember);
                addMemberForm.reset();
                closeModal(addMemberModal);
                renderMembersPage(document.querySelector('.filter-button.active').dataset.filter);
            } else {
                alert("Erro ao adicionar membro: " + (response.error || "Erro desconhecido"));
            }
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }

    // --- Modal Editar ---
    const editMemberModal = document.getElementById('edit-member-modal');
    const editMemberForm = document.getElementById('edit-member-form');
    
    if(document.getElementById('close-edit-member-modal-button')) {
        document.getElementById('close-edit-member-modal-button').addEventListener('click', () => closeModal(editMemberModal));
    }
    if(document.getElementById('cancel-edit-member-button')) {
        document.getElementById('cancel-edit-member-button').addEventListener('click', () => closeModal(editMemberModal));
    }
    
    function openEditMemberModal(memberId) {
        const member = localMembersDB.find(m => m.id === memberId);
        if (!member) return;

        document.getElementById('edit-member-id').value = member.id;
        
        // Preenche o modal dinamicamente (mesma lógica do seu código anterior)
        const modalBody = document.getElementById('edit-member-modal-body');
        modalBody.innerHTML = `
            <div class="flex items-center space-x-4">
                <img class="h-16 w-16 rounded-full" src="${member.photoUrl || 'https://placehold.co/100x100'}" alt="">
                <div>
                    <h4 class="text-lg font-bold">${member.name}</h4>
                    <p class="text-sm text-gray-500">${member.email}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label class="block text-sm font-medium text-gray-700">Diretoria</label>
                    <select id="edit-member-department" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">
                        <option ${member.department === 'Projetos' ? 'selected' : ''}>Projetos</option>
                        <option ${member.department === 'Marketing' ? 'selected' : ''}>Marketing</option>
                        <option ${member.department === 'Gente & Gestão' ? 'selected' : ''}>Gente & Gestão</option>
                        <option ${member.department === 'Presidência' ? 'selected' : ''}>Presidência</option>
                    </select>
                </div>
                 <div>
                    <label class="block text-sm font-medium text-gray-700">Cargo</label>
                    <select id="edit-member-role" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">
                        <option value="member" ${member.role === 'member' ? 'selected' : ''}>Membro</option>
                        <option value="director" ${member.role === 'director' ? 'selected' : ''}>Diretor</option>
                         <option value="vp" ${member.role === 'vp' ? 'selected' : ''}>Vice-Presidente</option>
                        <option value="president" ${member.role === 'president' ? 'selected' : ''}>Presidente</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="edit-member-status" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">
                        <option ${member.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                        <option ${member.status === 'Afastado' ? 'selected' : ''}>Afastado</option>
                        <option ${member.status === 'Desligado' ? 'selected' : ''}>Desligado</option>
                    </select>
                </div>
            </div>
        `;
        openModal(editMemberModal);
    }
    
    if (editMemberForm) {
        editMemberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = editMemberForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Salvando...";
            submitBtn.disabled = true;

            const memberId = parseInt(document.getElementById('edit-member-id').value);
            const memberIndex = localMembersDB.findIndex(m => m.id === memberId);
            
            if (memberIndex > -1) {
                const updatedMember = { ...localMembersDB[memberIndex] };
                updatedMember.department = document.getElementById('edit-member-department').value;
                updatedMember.role = document.getElementById('edit-member-role').value;
                updatedMember.status = document.getElementById('edit-member-status').value;
                
                const response = await updateMember(updatedMember);
                
                if (response.success || response.ok) {
                    localMembersDB[memberIndex] = updatedMember;
                    closeModal(editMemberModal);
                    renderMembersPage(document.querySelector('.filter-button.active').dataset.filter);
                } else {
                    alert("Erro ao atualizar membro: " + (response.error || "Erro desconhecido"));
                }
            }
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }

    initMembersPage();
});