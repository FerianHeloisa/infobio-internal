// ❗️ VERIFIQUE SE O CONFIG ESTÁ CARREGADO
const SCRIPT_URL = window.APP_CONFIG?.SCRIPT_URL;

if (!SCRIPT_URL) {
    console.error("❌ ERRO CRÍTICO: SCRIPT_URL não definida. Verifique config.js.");
    alert("Erro de configuração: URL da API não encontrada.");
}

async function apiRequest(method, resource, data = {}) {
    const params = method === 'GET' ? new URLSearchParams({ resource, ...data }) : '';
    const url = method === 'GET' ? `${SCRIPT_URL}?${params}` : SCRIPT_URL;
    
    const options = {
        method: method,
        // mode: 'no-cors' // JAMAIS use no-cors se você precisa ler a resposta
    };

    if (method === 'POST') {
        options.body = JSON.stringify({ resource, ...data });
        // O Apps Script Web App requer text/plain ou application/json, mas
        // para evitar preflight complexo, às vezes text/plain é mais seguro em ambientes simples.
        // Vamos manter o padrão que o fetch usa.
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const result = await response.json();
        return result; // Espera-se { ok: true, data: ... }
    } catch (error) {
        console.error(`Falha na requisição ${resource}:`, error);
        return { ok: false, error: error.message };
    }
}

// --- GETTERS ---

export async function getMembers() {
    const res = await apiRequest('GET', 'members');
    // Retorna o array de dados se ok, ou array vazio se falhar
    return res.ok ? res.data : [];
}

export async function getVacations() {
    const res = await apiRequest('GET', 'vacations');
    return res.ok ? res.data : [];
}

export async function getForms() {
    const res = await apiRequest('GET', 'forms');
    return res.ok ? res.data : [];
}

export async function getMeetings() {
    const res = await apiRequest('GET', 'meetings');
    // Retorna objeto vazio se falhar, pois meetings é um objeto { 'Ordinária': [] }
    return res.ok ? res.data : {};
}

// --- POSTERS ---

export async function addMember(memberData) {
    return await apiRequest('POST', 'createMember', memberData);
}

export async function updateMember(memberData) {
    // Atenção: memberData deve conter o ID para o backend saber quem atualizar
    return await apiRequest('POST', 'updateMember', memberData);
}

export async function createVacation(vacationData) {
    return await apiRequest('POST', 'createVacation', vacationData);
}

export async function addForm(formData) {
    return await apiRequest('POST', 'createForm', formData);
}

// Função genérica para criar feedback, etc.
export async function createRow(resource, data) {
    return await apiRequest('POST', resource, data);
}