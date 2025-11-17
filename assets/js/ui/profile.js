// Quando tiver API, substitua getCurrentUser() por auth.js + apiGet("members",{email})
function initials(name) {
  const parts = (name || "").trim().split(/\s+/);
  return (parts[0]?.[0] || "") + (parts[parts.length-1]?.[0] || "");
}

window.initProfile = function initProfile() {
  const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
  if (!user) {
    // fallback: usuário fake (dev)
    console.warn("No currentUser found, using fallback");
    return;
  }

  // preenche avatar e campos
  document.getElementById("profile-avatar").textContent = initials(user.name || user.email || "U").toUpperCase();
  document.getElementById("profile-name").textContent = user.name || "—";
  document.getElementById("profile-email").textContent = user.email || "—";
  document.getElementById("profile-department").textContent = user.department || "—";
  document.getElementById("profile-role").textContent = user.role || "—";
  document.getElementById("profile-dob").value = user.dob || "";
  document.getElementById("profile-status").value = user.status || "Ativo";

  // botões
  document.getElementById("profile-cancel").onclick = () => {
    // reseta valores (sem persistir)
    document.getElementById("profile-dob").value = user.dob || "";
  };

  document.getElementById("profile-save").onclick = async () => {
    const newDob = document.getElementById("profile-dob").value;
    // quando tiver API:
    // await apiPost("members_update", { id: user.id, dob: newDob })
    user.dob = newDob; // simula persistência local
    alert("Saved!");
  };
};
