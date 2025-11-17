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
    
    let localMembersDB = []; // Cache local para evitar re-fetch

    function renderMembersPage(filter = 'Ativo') {
        membersTableBody.innerHTML = '';
        const filteredMembers = localMembersDB.filter(member => {
            if (filter === 'Todos') return true;
            return member.status === filter;
        });

        if (filteredMembers.length === 0) {
            membersTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500">Nenhum membro encontrado com este status.</td></tr>`;
            return;
        }

        filteredMembers.forEach(member => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';
            const roleDisplay = {member: 'Membro', director: 'Diretor', vp: 'Vice-Presidente', president: 'Presidente'}[member.role] || 'Membro';
            const statusDisplay = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[member.status]}">${member.status}</span>`;
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center"><div class="flex-shrink-0 h-10 w-10"><img class="h-10 w-10 rounded-full" src="${member.photoUrl}" alt=""></div><div class="ml-4"><div class="text-sm font-medium text-gray-900">${member.name}</div><div class="text-sm text-gray-500">${member.email}</div></div></div></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.department}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${roleDisplay}</td>
                <td class="px-6 py-4 whitespace-nowrap">${statusDisplay}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button class="text-green-600 hover:text-green-900 edit-member-button" data-member-id="${member.id}">Editar</button></td>
            `;
            membersTableBody.appendChild(tr);
        });
    }
    
    // --- Listeners de Filtro e Tabela ---
    memberFilters.addEventListener('click', (e) => {
        if(e.target.classList.contains('filter-button')) {
            memberFilters.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderMembersPage(e.target.dataset.filter);
        }
    });

    membersTableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-member-button');
        if(editButton) {
            const memberId = parseInt(editButton.dataset.memberId);
            openEditMemberModal(memberId);
        }
    });

    // --- Modal de Adicionar Membro (Async) ---
    const addMemberModal = document.getElementById('add-member-modal');
    const addMemberForm = document.getElementById('add-member-form');
    document.getElementById('add-member-button').addEventListener('click', () => openModal(addMemberModal));
    document.getElementById('close-add-member-modal-button').addEventListener('click', () => closeModal(addMemberModal));
    document.getElementById('cancel-add-member-button').addEventListener('click', () => closeModal(addMemberModal));
    
    addMemberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-member-name').value;
        
        // Pega o ID mais alto e soma 1
        const newId = localMembersDB.length > 0 ? Math.max(...localMembersDB.map(m => m.id)) + 1 : 1;
        
        const newMember = {
            id: newId,
            name: name,
            email: document.getElementById('new-member-email').value,
            department: document.getElementById('new-member-department').value,
            role: document.getElementById('new-member-role').value,
            status: document.getElementById('new-member-status').value,
            photoUrl: `https://placehold.co/100x100/a3e635/1f2937?text=${name.charAt(0).toUpperCase()}`,
            dob: "", // Envia string vazia
            tasks: "[]", // Envia string JSON
            attendance: "{}" // Envia string JSON
        };
        
        // 1. Envia para a API
        const response = await addMember(newMember);
        
        if (response.success) {
            // 2. Atualiza o cache local e re-renderiza
            newMember.tasks = []; // Converte de volta para objeto
            newMember.attendance = {}; // Converte de volta para objeto
            localMembersDB.push(newMember);
            addMemberForm.reset();
            closeModal(addMemberModal);
            renderMembersPage(document.querySelector('.filter-button.active').dataset.filter);
        } else {
            alert("Erro ao adicionar membro.");
        }
    });

    // --- Modal de Editar Membro (Async) ---
    const editMemberModal = document.getElementById('edit-member-modal');
    const editMemberForm = document.getElementById('edit-member-form');
    const editMemberModalBody = document.getElementById('edit-member-modal-body');
    document.getElementById('close-edit-member-modal-button').addEventListener('click', () => closeModal(editMemberModal));
    document.getElementById('cancel-edit-member-button').addEventListener('click', () => closeModal(editMemberModal));
    
    function openEditMemberModal(memberId) {
        const member = localMembersDB.find(m => m.id === memberId);
        if (!member) return;

        document.getElementById('edit-member-id').value = member.id;
        
        editMemberModalBody.innerHTML = `
            <div class="flex items-center space-x-4">
                <img class="h-16 w-16 rounded-full" src="${member.photoUrl}" alt="">
                <div>
                    <h4 class="text-lg font-bold">${member.name}</h4>
                    <p class="text-sm text-gray-500">${member.email}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label for="edit-member-department" class="block text-sm font-medium text-gray-700">Diretoria</label>
                    <select id="edit-member-department" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                        <option ${member.department === 'Projetos' ? 'selected' : ''}>Projetos</option>
                        <option ${member.department === 'Marketing' ? 'selected' : ''}>Marketing</option>
                        <option ${member.department === 'Gente & Gestão' ? 'selected' : ''}>Gente & Gestão</option>
                        <option ${member.department === 'Presidência' ? 'selected' : ''}>Presidência</option>
                    </select>
                </div>
                 <div>
                    <label for="edit-member-role" class="block text-sm font-medium text-gray-700">Cargo</label>
                    <select id="edit-member-role" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                        <option value="member" ${member.role === 'member' ? 'selected' : ''}>Membro</option>
                        <option value="director" ${member.role === 'director' ? 'selected' : ''}>Diretor</option>
                         <option value="vp" ${member.role === 'vp' ? 'selected' : ''}>Vice-Presidente</option>
                        <option value="president" ${member.role === 'president' ? 'selected' : ''}>Presidente</option>
                    </select>
                </div>
                <div>
                    <label for="edit-member-status" class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="edit-member-status" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                        <option ${member.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                        <option ${member.status === 'Afastado' ? 'selected' : ''}>Afastado</option>
                        <option ${member.status === 'Desligado' ? 'selected' : ''}>Desligado</option>
                    </select>
                </div>
            </div>
        `;
        openModal(editMemberModal);
    }
    
    editMemberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const memberId = parseInt(document.getElementById('edit-member-id').value);
        const memberIndex = localMembersDB.findIndex(m => m.id === memberId);
        
        if (memberIndex > -1) {
            // 1. Atualiza o objeto no cache local
            const updatedMember = { ...localMembersDB[memberIndex] }; // Copia
            updatedMember.department = document.getElementById('edit-member-department').value;
            updatedMember.role = document.getElementById('edit-member-role').value;
            updatedMember.status = document.getElementById('edit-member-status').value;
            
            // 2. Envia para a API
            const response = await updateMember(updatedMember);
            
            if (response.success) {
                // 3. Confirma a mudança no cache local
                localMembersDB[memberIndex] = updatedMember;
                closeModal(editMemberModal);
                renderMembersPage(document.querySelector('.filter-button.active').dataset.filter);
            } else {
                alert("Erro ao atualizar membro.");
            }
        }
    });
    
    // --- Renderização Inicial ---
    async function initMembersPage() {
        localMembersDB = await getMembers(); // Busca os dados uma vez
        renderMembersPage('Ativo'); // Renderiza com o cache
    }

    initMembersPage();
});