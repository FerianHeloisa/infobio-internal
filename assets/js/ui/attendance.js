import { getCurrentUser } from '../auth.js';
import { getMeetings, getMembers, updateMember } from '../api.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('attendance-page')) return;
    
    const attendanceTabs = document.getElementById('attendance-tabs');
    const attendanceThead = document.getElementById('attendance-table-head');
    const attendanceTbody = document.getElementById('attendance-table-body');
    const attendanceTableTitle = document.getElementById('attendance-table-title');
    const attendanceSelector = document.getElementById('attendance-department-selector');

    let localMembersDB = [];
    let localMeetingsDB = {};
    const loggedInUser = getCurrentUser();
    
    function renderAttendancePage() {
        const userRole = loggedInUser.role;
        let currentDepartment = loggedInUser.department;
        
        // VP/Presidente pode trocar de diretoria
        if (userRole === 'vp' || userRole === 'president') {
            const departments = [...new Set(localMembersDB.map(m => m.department))];
            attendanceSelector.innerHTML = departments.map(d => `<option value="${d}">${d}</option>`).join('');
            attendanceSelector.value = departments[0];
            currentDepartment = departments[0];
            
            attendanceSelector.addEventListener('change', (e) => {
                renderAttendanceTableForDepartment(e.target.value);
            });
        }

        renderAttendanceTableForDepartment(currentDepartment);
    }

    function renderAttendanceTableForDepartment(department) {
        attendanceTabs.innerHTML = '';
        
        const createTab = (text, type, isActive = false) => {
            const button = document.createElement('button');
            button.className = `tab-button py-3 px-1 border-b-2 font-medium text-sm text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 ${isActive ? 'active' : ''}`;
            button.textContent = text;
            button.dataset.meetingType = type;
            button.dataset.department = department;
            button.addEventListener('click', () => {
                attendanceTabs.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderAttendanceTable(button.dataset.meetingType, department);
            });
            return button;
        };

        attendanceTabs.appendChild(createTab('Reunião Ordinária', 'Ordinária', true));
        if (localMeetingsDB[department]) {
            attendanceTabs.appendChild(createTab(`Reunião ${department}`, department));
        }
        
        // Renderiza a tabela da primeira aba (Ordinária)
        renderAttendanceTable('Ordinária', department);
    }

    function renderAttendanceTable(meetingType, departmentForView) {
        attendanceTableTitle.textContent = `Controle de Presença - ${meetingType === 'Ordinária' ? 'Reunião Ordinária' : `Reunião ${meetingType}`}`;
        
        const meetings = localMeetingsDB[meetingType];
        
        if (!meetings) {
            attendanceThead.innerHTML = '';
            attendanceTbody.innerHTML = '<tr><td colspan="5" class="p-4 text-gray-500">Não há reuniões deste tipo cadastradas.</td></tr>';
            return;
        }

        // Cria o Cabeçalho
        let headerHtml = '<tr><th scope="col" class="sticky left-0 bg-gray-50 z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membro</th>';
        meetings.forEach(meeting => { headerHtml += `<th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">${meeting.date}<br><span class="font-normal normal-case">${meeting.day}</span></th>`; });
        headerHtml += `<th scope="col" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P</th><th scope="col" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">F</th><th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Faltas</th></tr>`;
        attendanceThead.innerHTML = headerHtml;

        // Cria o Corpo da Tabela
        attendanceTbody.innerHTML = '';
        const membersToDisplay = meetingType === 'Ordinária' 
            ? localMembersDB.filter(m => m.status === 'Ativo') 
            : localMembersDB.filter(m => m.department === departmentForView && m.status === 'Ativo');

        membersToDisplay.forEach(member => {
            const tr = document.createElement('tr');
            let rowHtml = `<td class="sticky left-0 bg-white z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${member.name}</td>`;
            const memberAttendance = member.attendance[meetingType] || [];
            
            meetings.forEach((_, index) => {
                const status = memberAttendance[index] || false;
                rowHtml += `<td class="px-6 py-4 whitespace-nowrap text-center"><input type="checkbox" class="attendance-checkbox" data-member-id="${member.id}" data-meeting-type="${meetingType}" data-meeting-index="${index}" ${status ? 'checked' : ''}></td>`;
            });
            
            const presentCount = memberAttendance.filter(Boolean).length;
            const absentCount = meetings.length - presentCount;
            const absentPercentage = meetings.length > 0 ? ((absentCount / meetings.length) * 100).toFixed(1) : 0;
            
            rowHtml += `<td class="px-3 py-4 text-center text-sm font-semibold present-count">${presentCount}</td><td class="px-3 py-4 text-center text-sm font-semibold absent-count">${absentCount}</td><td class="px-6 py-4 text-center text-sm ${absentPercentage > 25 ? 'text-red-600 font-bold' : ''} absent-percentage">${absentPercentage}%</td>`;
            tr.innerHTML = rowHtml;
            attendanceTbody.appendChild(tr);
        });
    }
    
    // Listener para salvar (Agora é ASYNC)
    attendanceTbody.addEventListener('change', async (e) => { 
        if (e.target.classList.contains('attendance-checkbox')) {
            const memberId = parseInt(e.target.dataset.memberId, 10);
            const meetingType = e.target.dataset.meetingType;
            const meetingIndex = parseInt(e.target.dataset.meetingIndex, 10);
            const isPresent = e.target.checked;
            
            // 1. Encontra o membro no cache local
            const member = localMembersDB.find(m => m.id === memberId);
            
            if (member) {
                // 2. Atualiza o objeto de presença
                if (!member.attendance[meetingType]) {
                    member.attendance[meetingType] = [];
                }
                member.attendance[meetingType][meetingIndex] = isPresent;
                
                // 3. Envia o objeto 'member' INTEIRO para a API
                const response = await updateMember(member);
                
                if (!response.success) {
                    // Reverte a mudança em caso de erro
                    alert("Erro ao salvar presença.");
                    member.attendance[meetingType][meetingIndex] = !isPresent;
                }
                
                // 4. Re-renderiza a tabela (com dados locais)
                const departmentForView = document.querySelector('#attendance-tabs .active')?.dataset.department || loggedInUser.department;
                renderAttendanceTable(meetingType, departmentForView);
            }
        }
     });

    // --- Renderização Inicial ---
    async function initAttendancePage() {
        // Busca os dados uma vez em paralelo
        [localMembersDB, localMeetingsDB] = await Promise.all([
            getMembers(),
            getMeetings()
        ]);
        renderAttendancePage(); // Renderiza com o cache
    }

    initAttendancePage();
});