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

  // 204 : rien à décoder par définition
  if (res.status === 204) {
    if (!res.ok) throw new Error("Une erreur est survenue");
    return null;
  }

  // Toute réponse n'est pas du JSON : une passerelle en erreur renvoie
  // une page HTML, un 502 pendant un redéploiement renvoie un corps vide.
  // res.json() y répondait « Unexpected end of JSON input » — un message
  // qui n'apprend rien à personne et masque la vraie panne.
  const texte = await res.text();
  // `any` assumé : chaque appelant connaît la forme qu'il attend et la
  // déclare de son côté. Typer ici obligerait à caster partout.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  if (texte) {
    try {
      data = JSON.parse(texte);
    } catch {
      /* réponse non-JSON : on retombe sur un message parlant ci-dessous */
    }
  }

  if (!res.ok) {
    if (data?.error) throw new Error(data.error);
    // Le serveur n'a rien dit d'intelligible : on nomme au moins la panne.
    if (res.status >= 500) {
      throw new Error(
        "Le serveur est momentanément indisponible. Réessayez dans un instant."
      );
    }
    throw new Error(`Une erreur est survenue (${res.status}).`);
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
  updateProfil: (body: {
    dateNaissance?: string | null;
    ascendant?: string | null;
    /** « Ce que je veux aborder » — écrit par la cliente, lu par Elena */
    aAborder?: string;
  }) => request("/profil", { method: "PATCH", body: JSON.stringify(body) }),
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
  // Rendez-vous Calendly
  adminGetRendezVous: (jour?: string) =>
    request(`/admin/rendez-vous${jour ? `?jour=${jour}` : ""}`),
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
  // Fait VRAIMENT sonner le téléphone d'Elena et lui joue le message
  // que ses clientes entendent (l'autotest ne lit que la configuration).
  adminEssaiLigne: () => request("/admin/essai-ligne", { method: "POST" }),
  adminLancerConsultation: (telephone: string, forfaitCode: string) =>
    request("/admin/consultation-minutee", {
      method: "POST",
      body: JSON.stringify({ telephone, forfaitCode }),
    }),
  // Même route, depuis un rendez-vous Calendly : `rendezVousId` fait
  // enregistrer la TENTATIVE (pas la réussite — cf. finalizeSession).
  adminLancerForfait: (body: {
    telephone: string;
    forfaitCode: string | null;
    rendezVousId: string;
  }) =>
    request("/admin/consultation-minutee", {
      method: "POST",
      body: JSON.stringify(body),
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
