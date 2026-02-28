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

  // Consultants
  getConsultants: (params?: string) =>
    request(`/consultants${params ? `?${params}` : ""}`),
  getConsultant: (id: string) => request(`/consultants/${id}`),

  // Wallet
  getWallet: () => request("/wallets/me"),
  topUp: (amount: number) =>
    request("/wallets/topup", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  getTransactions: () => request("/wallets/transactions"),

  // Sessions
  createSession: (consultantId: string) =>
    request("/sessions", {
      method: "POST",
      body: JSON.stringify({ consultantId }),
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
