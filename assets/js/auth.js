/* let currentUser = null;

async function loginByEmail(email) {
  const { ok, data } = await apiGet("members", { email });
  if (!ok || !Array.isArray(data) || data.length === 0) return null;
  const user = data[0];
  if (user.status !== "Ativo") return null;
  currentUser = user;
  return user;
}

function getCurrentUser() {
  return currentUser;
}

function logout() {
  currentUser = null;
  document.getElementById("app-container").classList.add("hidden");
  document.getElementById("login-page").classList.remove("hidden");
}
*/

let currentUser = null;

async function loginByEmail(email) {
  // Simulação local — remove depois que conectar à API
  const fakeMembers = [
    { name: "Heloisa Ferian Soares", email: "helo@infobiojr.com.br", department: "Gente & Gestão", role: "Diretora", status: "Ativo" }
  ];

  const user = fakeMembers.find(m => m.email === email && m.status === "Ativo");
  if (!user) return null;
  currentUser = user;
  return user;
}

function getCurrentUser() {
  return currentUser;
}

function logout() {
  currentUser = null;
  document.getElementById("app-container").classList.add("hidden");
  document.getElementById("login-page").classList.remove("hidden");
}
