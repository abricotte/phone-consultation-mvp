const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // 204 (ou corps vide) : rien à décoder — res.json() lèverait ici
  if (res.status === 204) {
    if (!res.ok) throw new Error("Une erreur est survenue");
    return null;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Une erreur est survenue");
  }

  return data;
}

export const api = {
  // Auth
  register: (body: Record<string, unknown>) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  getMe: () => request("/auth/me"),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  changePhone: (phone: string) =>
    request("/auth/phone", {
      method: "PATCH",
      body: JSON.stringify({ phone }),
    }),

  // Profil cliente (date de naissance + "personnes qui comptent")
  getProfil: () => request("/profil"),
  updateProfil: (body: { dateNaissance?: string | null; ascendant?: string | null }) =>
    request("/profil", { method: "PATCH", body: JSON.stringify(body) }),
  addProche: (body: {
    prenom: string;
    dateNaissance: string | null;
    ascendant?: string | null;
    lien: string;
  }) => request("/profil/proches", { method: "POST", body: JSON.stringify(body) }),
  deleteProche: (id: string) =>
    request(`/profil/proches/${id}`, { method: "DELETE" }),

  // Consultants
  getConsultants: (params?: string) =>
    request(`/consultants${params ? `?${params}` : ""}`),
  getConsultant: (id: string) => request(`/consultants/${id}`),

  // Wallet
  getWallet: () => request("/wallets/me"),
  topUp: (minutes: number) =>
    request("/wallets/topup", {
      method: "POST",
      body: JSON.stringify({ minutes }),
    }),
  getTransactions: () => request("/wallets/transactions"),

  // Config publique (tarifs de recharge, statut en ligne)
  getRechargeConfig: () => request("/config/recharge"),
  getStatut: () => request("/config/statut"),
  // Compteur de fréquentation anonyme : aucun identifiant transmis
  enregistrerVisite: (body: { page: string; avecCredit: boolean }) =>
    request("/config/visite", { method: "POST", body: JSON.stringify(body) }),

  // Admin (praticienne)
  adminGetStatut: () => request("/admin/statut"),
  adminSetStatut: (enLigne: boolean) =>
    request("/admin/statut", {
      method: "PATCH",
      body: JSON.stringify({ enLigne }),
    }),
  adminGetJour: () => request("/admin/jour"),
  adminGetAppels: () => request("/admin/appels"),
  adminGetClientes: () => request("/admin/clientes"),
  adminGetCliente: (id: string) => request(`/admin/clientes/${id}`),
  // Carnet privé de la praticienne
  adminAddNote: (
    clienteId: string,
    body: { contenu: string; aSuivre?: boolean; echeance?: string | null }
  ) =>
    request(`/admin/clientes/${clienteId}/notes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  adminCloreNote: (noteId: string, close: boolean) =>
    request(`/admin/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify({ close }),
    }),
  adminDeleteNote: (noteId: string) =>
    request(`/admin/notes/${noteId}`, { method: "DELETE" }),
  adminGetSuivis: () => request("/admin/suivis"),
  // Augures — ce qui a été annoncé
  adminAddAugure: (
    clienteId: string,
    body: { contenu: string; echeance?: string | null; echeanceTexte?: string | null }
  ) =>
    request(`/admin/clientes/${clienteId}/augures`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  adminMajAugure: (id: string, statut: string) =>
    request(`/admin/augures/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ statut }),
    }),
  adminGetAReprendre: () => request("/admin/a-reprendre"),
  // Dates qui pèsent
  adminAddDate: (
    clienteId: string,
    body: { libelle: string; date: string; recurrenceAnnuelle?: boolean }
  ) =>
    request(`/admin/clientes/${clienteId}/dates`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  adminDeleteDate: (id: string) =>
    request(`/admin/dates/${id}`, { method: "DELETE" }),
  adminGetDatesAVenir: (jours = 45) =>
    request(`/admin/dates-a-venir?jours=${jours}`),
  adminGetFrequentation: (jours = 30) =>
    request(`/admin/frequentation?jours=${jours}`),
  adminGetRecharges: () => request("/admin/recharges"),
  // Profil praticienne
  adminGetProfil: () => request("/admin/profil"),
  adminPatchTarifs: (body: Record<string, unknown>) =>
    request("/admin/tarifs", { method: "PATCH", body: JSON.stringify(body) }),
  adminPatchTextes: (body: Record<string, unknown>) =>
    request("/admin/textes", { method: "PATCH", body: JSON.stringify(body) }),
  // Réglages de pilotage — en base, plus dans le navigateur
  adminPatchReglages: (body: Record<string, unknown>) =>
    request("/admin/reglages", { method: "PATCH", body: JSON.stringify(body) }),
  // Numéros bloqués
  adminGetNumerosBloques: () => request("/admin/numeros-bloques"),
  adminBloquerNumero: (telephone: string, motif?: string) =>
    request("/admin/numeros-bloques", {
      method: "POST",
      body: JSON.stringify({ telephone, motif }),
    }),
  adminDebloquerNumero: (id: string) =>
    request(`/admin/numeros-bloques/${id}`, { method: "DELETE" }),
  // Changement de numéro, avec appel de vérification préalable
  adminDemanderVerifTel: (telephone: string) =>
    request("/admin/telephone/demander", {
      method: "POST",
      body: JSON.stringify({ telephone }),
    }),
  adminConfirmerVerifTel: (code: string) =>
    request("/admin/telephone/confirmer", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  adminAnnulerVerifTel: () =>
    request("/admin/telephone/verification", { method: "DELETE" }),
  // Santé de la ligne téléphonique
  adminGetLigne: () => request("/admin/ligne"),
  adminAutotest: () => request("/admin/autotest"),
  adminLancerConsultation: (telephone: string, forfaitCode: string) =>
    request("/admin/consultation-minutee", {
      method: "POST",
      body: JSON.stringify({ telephone, forfaitCode }),
    }),

  // Sessions (mono-praticienne : le consultant est résolu côté backend)
  createSession: () =>
    request("/sessions", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  endSession: (id: string) =>
    request(`/sessions/${id}/end`, { method: "PATCH" }),
  getSessionHistory: () => request("/sessions/history"),

  // Calls (Twilio)
  initiateCall: (sessionId: string) =>
    request("/calls/initiate", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),
};
