// ❗️❗️ COLE A URL DA SUA IMPLANTAÇÃO AQUI ❗️❗️
const SCRIPT_URL = "https://script.google.com/macros/s/SUA_URL_DE_IMPLANTACAO_AQUI/exec";

// ==================================================
// FUNÇÕES DE LEITURA (GET)
// ==================================================

/**
 * Busca todos os membros do Google Sheet.
 * @returns {Promise<Array<Object>>} Uma promessa que resolve para a lista de membros.
 */
export async function getMembers() {
    const url = `${SCRIPT_URL}?action=getMembers`;
    return fetchData(url);
}

/**
 * Busca todos os formulários do Google Sheet.
 * @returns {Promise<Array<Object>>}
 */
export async function getForms() {
    const url = `${SCRIPT_URL}?action=getForms`;
    return fetchData(url);
}

/**
 * Busca todas as reuniões do Google Sheet.
 * @returns {Promise<Object>}
 */
export async function getMeetings() {
    const url = `${SCRIPT_URL}?action=getMeetings`;
    return fetchData(url);
}

// ==================================================
// FUNÇÕES DE ESCRITA (POST)
// ==================================================

/**
 * Adiciona um novo membro ao Google Sheet.
 * @param {Object} memberData - O objeto do membro (ex: { name: '...', email: '...' })
 * @returns {Promise<Object>} A resposta do servidor.
 */
export async function addMember(memberData) {
    const payload = {
        action: 'addMember',
        data: memberData
    };
    return postData(payload);
}

/**
 * Atualiza um membro existente no Google Sheet.
 * @param {Object} memberData - O objeto COMPLETO do membro.
 * @returns {Promise<Object>} A resposta do servidor.
 */
export async function updateMember(memberData) {
    const payload = {
        action: 'updateMember',
        data: memberData
    };
    return postData(payload);
}

// (Adicione 'addForm', 'updateForm' aqui conforme sua necessidade)

// ==================================================
// FUNÇÕES AUXILIARES DE FETCH
// ==================================================

/**
 * Função genérica para buscar dados (GET).
 */
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Falha ao buscar dados:", error);
        return []; // Retorna um array vazio em caso de falha
    }
}

/**
 * Função genérica para enviar dados (POST).
 */
async function postData(payload) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            // redirect: 'follow', // Pode ser necessário dependendo da configuração
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Requerido pelo Apps Script
            },
        });
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Falha ao enviar dados:", error);
        return { success: false, error: error.message };
    }
}

// ... (abaixo das outras funções POST) ...

/**
 * Adiciona um novo formulário ao Google Sheet.
 * @param {Object} formData - O objeto do formulário (ex: { id: 3, title: '...', target: '...' })
 * @returns {Promise<Object>} A resposta do servidor.
 */
export async function addForm(formData) {
    const payload = {
        action: 'addForm',
        data: formData
    };
    return postData(payload);
}

/**
 * Atualiza um formulário existente no Google Sheet.
 * @param {Object} formData - O objeto COMPLETO do formulário.
 * @returns {Promise<Object>} A resposta do servidor.
 */
export async function updateForm(formData) {
    const payload = {
        action: 'updateForm',
        data: formData
    };
    return postData(payload);
}