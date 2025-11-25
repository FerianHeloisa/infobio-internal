// ❗️ COLE A URL DA SUA IMPLANTAÇÃO DO APPS SCRIPT AQUI ❗️
const SCRIPT_URL = window.APP_CONFIG?.SCRIPT_URL || "";

if (!SCRIPT_URL) {
    console.error("❌ ERRO: SCRIPT_URL não carregou. Verifique config.js.");
}

// ==================================================
// FUNÇÕES GENÉRICAS DE CHAMADA À API
// ==================================================

/**
 * Chamada GET para a API do Apps Script.
 * @param {string} resource - Nome do recurso (ex: "members", "feedback").
 * @param {Object} params - Parâmetros extras de query.
 */
async function apiGet(resource, params = {}) {
    const search = new URLSearchParams({
        resource,
        ...params
    }).toString();

    try {
        const response = await fetch(`${SCRIPT_URL}?${search}`);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }
        const json = await response.json();
        return json; // { ok: true/false, data: ... }
    } catch (error) {
        console.error("Falha ao buscar dados da API:", error);
        return { ok: false, data: null, error: error.message };
    }
}

/**
 * Chamada POST para a API do Apps Script.
 * @param {string} resource - Nome da ação/recurso (ex: "createFeedback").
 * @param {Object} body - Dados a serem enviados.
 */
async function apiPost(resource, body = {}) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resource,
                ...body,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        return json; // { ok: true/false, ... }
    } catch (error) {
        console.error("Falha ao enviar dados para a API:", error);
        return { ok: false, error: error.message };
    }
}

// ==================================================
// FUNÇÕES ESPECÍFICAS (USADAS PELO SISTEMA)
// ==================================================

/**
 * Busca todos os membros (aba "members").
 * Retorna diretamente o ARRAY de membros (para usar em auth.js).
 */
export async function getMembers() {
    const res = await apiGet("members");
    if (!res.ok || !Array.isArray(res.data)) {
        return [];
    }
    return res.data;
}

/**
 * (Opcional) Busca um membro específico por e-mail usando o endpoint memberByEmail_.
 * Não é obrigatório pro login atual, mas já deixo pronto.
 */
export async function getMemberByEmail(email) {
    const res = await apiGet("memberByEmail", { email });
    if (!res.ok) return null;
    return res.data;
}

/**
 * Busca todos os registros de presença (aba "attendance").
 */
export async function getAttendance() {
    const res = await apiGet("attendance");
    if (!res.ok || !Array.isArray(res.data)) {
        return [];
    }
    return res.data;
}

/**
 * Cria um novo registro de presença (aba "attendance").
 * Espera um objeto ex: { date, memberEmail, slot, type, present }
 */
export async function createAttendance(attendanceData) {
    return apiPost("createAttendance", attendanceData);
}

/**
 * Busca todas as solicitações de férias (aba "vacations").
 */
export async function getVacations() {
    const res = await apiGet("vacations");
    if (!res.ok || !Array.isArray(res.data)) {
        return [];
    }
    return res.data;
}

/**
 * Cria uma nova solicitação de férias (aba "vacations").
 * Ex: { email, startDate, endDate, reason }
 */
export async function createVacation(vacationData) {
    return apiPost("createVacation", vacationData);
}

/**
 * Busca todos os feedbacks (aba "feedback").
 */
export async function getFeedback() {
    const res = await apiGet("feedback");
    if (!res.ok || !Array.isArray(res.data)) {
        return [];
    }
    return res.data;
}

/**
 * Envia um novo feedback (aba "feedback").
 * Ex: { email, type, message }
 */
export async function createFeedback(feedbackData) {
    return apiPost("createFeedback", feedbackData);
}

// ==================================================
// FUNÇÕES LEGADAS / FUTURAS (forms, meetings, etc.)
// ==================================================
// Estas funções só vão funcionar quando você criar
// os endpoints correspondentes no Apps Script.
// Deixo aqui já adaptadas para o novo padrão.

/**
 * Busca formulários (quando você implementar o recurso "forms" na API).
 */
export async function getForms() {
    const res = await apiGet("forms");
    if (!res.ok || !Array.isArray(res.data)) {
        return [];
    }
    return res.data;
}

/**
 * Exemplo de função para reuniões, se no futuro você criar um endpoint "meetings".
 */
export async function getMeetings() {
    const res = await apiGet("meetings");
    if (!res.ok || !Array.isArray(res.data)) {
        return [];
    }
    return res.data;
}

/**
 * Adiciona um novo formulário (quando tiver endpoint "createForm").
 */
export async function addForm(formData) {
    return apiPost("createForm", formData);
}

/**
 * Atualiza um formulário existente (quando tiver endpoint "updateForm").
 */
export async function updateForm(formData) {
    return apiPost("updateForm", formData);
}


/**
 * Adiciona um novo membro (se você criar endpoint "createMember" no Apps Script).
 */
export async function addMember(memberData) {
    return apiPost("createMember", memberData);
}

/**
 * Atualiza um membro (se você criar endpoint "updateMember" no Apps Script).
 */
export async function updateMember(memberData) {
    return apiPost("updateMember", memberData);
}
