document.addEventListener('DOMContentLoaded', () => {
    // Trava de segurança
    if (!document.getElementById('vacation-page')) return;

    // Simula a data atual, como no original
    let currentDate = new Date(2025, 9, 20); 
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('calendar-month-year');

    function initCalendar() {
        // Apenas para mostrar algo
        if(monthYearDisplay) {
            monthYearDisplay.textContent = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        }
        
        if (calendarGrid) {
            // Gera um grid de calendário falso
            let daysHtml = '';
            for (let i = 0; i < 35; i++) {
                daysHtml += `<div class="p-2 h-20 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm">${i - 4}</div>`;
            }
            calendarGrid.innerHTML = daysHtml;
        }
    }
    
    // Listener do formulário de férias (apenas simulação)
    const vacationForm = document.getElementById('vacation-form');
    if (vacationForm) {
        vacationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Aqui você chamaria a API (ex: await addVacationRequest(...))
            
            // Por enquanto, apenas mostramos a mensagem de sucesso
            const successMsg = document.getElementById('vacation-success');
            successMsg.classList.remove('hidden');
            setTimeout(() => successMsg.classList.add('hidden'), 2000);
            e.target.reset();
        });
    }
    
    // (Listeners dos botões prev/next month iriam aqui)
    
    initCalendar();
});