// ===== Sources de dados =====
// Quando conectar ao Google Sheets, troque getMembers() para usar apiGet("members")
async function getMembers() {
  // Fake data enquanto a API não estiver pronta
  return [
    { id: 1, name: "Heloisa Ferian Soares", email: "helo@infobiojr.com.br", department: "Gente & Gestão", role: "Diretor(a)", status: "Ativo" },
    { id: 2, name: "Ana Silva", email: "ana@infobiojr.com.br", department: "Marketing", role: "Member", status: "Ativo" },
    { id: 3, name: "João Santos", email: "joao@infobiojr.com.br", department: "Projects", role: "Member", status: "Licença" },
    { id: 4, name: "Marcos Lima", email: "marcos@infobiojr.com.br", department: "Presidência", role: "VP", status: "Ativo" },
    { id: 5, name: "Paula Souza", email: "paula@infobiojr.com.br", department: "Projects", role: "Member", status: "Inativo" },
  ];
}

// Estado em memória
let ALL_MEMBERS = [];
let FILTERED = [];
let CURRENT_SELECTED = null;

// ===== Helpers =====
function byText(value, q) {
  return (value || "").toLowerCase().includes(q);
}

function applyFilters() {
  const q = document.getElementById("members-search").value.trim().toLowerCase();
  const dep = document.getElementById("filter-department").value;
  const role = document.getElementById("filter-role").value;
  const status = document.getElementById("filter-status").value;

  FILTERED = ALL_MEMBERS.filter(m => {
    const txt = q ? (byText(m.name, q) || byText(m.email, q)) : true;
    const okDep = dep ? m.department === dep : true;
    const okRole = role ? m.role === role : true;
    const okStatus = status ? m.status === status : true;
    return txt && okDep && okRole && okStatus;
  });

  renderTable();
  renderKPIs();
}

function renderKPIs() {
  const total = FILTERED.length;
  const active = FILTERED.filter(m => m.status === "Ativo").length;
  const onleave = FILTERED.filter(m => m.status === "Licença").length;
  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-active").textContent = active;
  document.getElementById("kpi-onleave").textContent = onleave;
}

function renderTable() {
  const tbody = document.getElementById("members-tbody");
  tbody.innerHTML = FILTERED.map(m => `
    <tr>
      <td class="px-4 py-3">${m.name}</td>
      <td class="px-4 py-3">${m.email}</td>
      <td class="px-4 py-3">${m.department}</td>
      <td class="px-4 py-3">${m.role}</td>
      <td class="px-4 py-3">${m.status}</td>
      <td class="px-4 py-3 text-right">
        <button data-id="${m.id}" class="btn-view px-3 py-1 rounded-md border bg-white hover:bg-gray-50">View</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".btn-view").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-id"));
      CURRENT_SELECTED = ALL_MEMBERS.find(x => x.id === id);
      openDrawer(CURRENT_SELECTED);
    });
  });
}

function openDrawer(member) {
  const el = document.getElementById("member-drawer");
  const box = document.getElementById("member-details");
  box.innerHTML = `
    <div>
      <p class="text-sm text-gray-500">Name</p>
      <p class="font-medium">${member.name}</p>
    </div>
    <div>
      <p class="text-sm text-gray-500">Email</p>
      <p class="font-medium">${member.email}</p>
    </div>
    <div>
      <p class="text-sm text-gray-500">Department</p>
      <p class="font-medium">${member.department}</p>
    </div>
    <div>
      <p class="text-sm text-gray-500">Role</p>
      <p class="font-medium">${member.role}</p>
    </div>
    <div>
      <p class="text-sm text-gray-500">Status</p>
      <p>
        <select id="edit-status" class="border rounded-md px-2 py-1">
          <option ${member.status==="Ativo"?"selected":""}>Ativo</option>
          <option ${member.status==="Inativo"?"selected":""}>Inativo</option>
          <option ${member.status==="Licença"?"selected":""}>Licença</option>
        </select>
      </p>
    </div>
  `;
  el.classList.remove("hidden");

  document.getElementById("drawer-close").onclick = () => el.classList.add("hidden");
  document.getElementById("btn-save-member").onclick = async () => {
    // salvar futuro: apiPost('members/update', …) no Apps Script
    const newStatus = document.getElementById("edit-status").value;
    CURRENT_SELECTED.status = newStatus;
    applyFilters();
    el.classList.add("hidden");
  };
  document.getElementById("btn-edit-member").onclick = () => {
    // (opcional) abrir modo edição com mais campos
    alert("Edit mode coming soon 😄");
  };
}

function clearFilters() {
  document.getElementById("members-search").value = "";
  document.getElementById("filter-department").value = "";
  document.getElementById("filter-role").value = "";
  document.getElementById("filter-status").value = "";
  applyFilters();
}

function exportCSV() {
  const rows = [
    ["name","email","department","role","status"],
    ...FILTERED.map(m => [m.name,m.email,m.department,m.role,m.status])
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "members.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ===== Entrada principal desta página =====
window.initMembers = async function initMembers() {
  ALL_MEMBERS = await getMembers();
  FILTERED = [...ALL_MEMBERS];

  // binds
  document.getElementById("members-search").addEventListener("input", applyFilters);
  document.getElementById("filter-department").addEventListener("change", applyFilters);
  document.getElementById("filter-role").addEventListener("change", applyFilters);
  document.getElementById("filter-status").addEventListener("change", applyFilters);
  document.getElementById("btn-clear-filters").addEventListener("click", clearFilters);
  document.getElementById("btn-reload-members").addEventListener("click", async () => {
    ALL_MEMBERS = await getMembers();
    applyFilters();
  });
  document.getElementById("btn-export-members").addEventListener("click", exportCSV);

  renderTable();
  renderKPIs();
};
