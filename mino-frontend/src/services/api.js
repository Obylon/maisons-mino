import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081/api",
});

// Attache le JWT à chaque requête sortante
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mino_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si le backend répond 401 (token expiré/invalide), on déconnecte proprement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("mino_token");
      localStorage.removeItem("mino_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// --- Endpoints regroupés par domaine, en miroir exact des routes du backend ---

export const authApi = {
  login: (email, motDePasse) => api.post("/auth/login", { email, motDePasse }),
  motDePasseOublie: (email) => api.post("/auth/mot-de-passe-oublie", { email }),
  mettreAJourProfil: (payload) => api.put("/auth/mon-profil", payload),
  changerMotDePasse: (ancienMotDePasse, nouveauMotDePasse) =>
    api.put("/auth/changer-mot-de-passe", { ancienMotDePasse, nouveauMotDePasse }),
};

export const adminApi = {
  listerUtilisateurs: (page = 0, size = 20) => api.get(`/admin/utilisateurs?page=${page}&size=${size}`),
  listerMamans: () => api.get("/admin/utilisateurs/mamans"),
  listerProfessionnels: () => api.get("/admin/utilisateurs/professionnels"),
  creerCompte: (payload) => api.post("/admin/utilisateurs", payload),
  desactiver: (id) => api.post(`/admin/utilisateurs/${id}/desactiver`),
  activer: (id) => api.post(`/admin/utilisateurs/${id}/activer`),
  reinitialiserMotDePasse: (id) => api.post(`/admin/utilisateurs/${id}/reinitialiser-mot-de-passe`),
  supprimerDefinitivement: (id) => api.delete(`/admin/utilisateurs/${id}`),
};

export const cohorteApi = {
  lister: () => api.get("/cohortes"),
  obtenir: (id) => api.get(`/cohortes/${id}`),
  creer: (payload) => api.post("/cohortes", payload),
  modifier: (id, payload) => api.put(`/cohortes/${id}`, payload),
  supprimer: (id) => api.delete(`/cohortes/${id}`),
  mamansEnAttente: (id) => api.get(`/cohortes/${id}/mamans-en-attente`),
};

export const mamanApi = {
  monParcours: () => api.get("/maman/parcours"),
  mettreAJourParcours: (payload) => api.put("/maman/parcours", payload),
};

export const professionnelApi = {
  monProfil: () => api.get("/professionnel/mon-profil"),
  mettreAJourProfil: (payload) => api.put("/professionnel/mon-profil", payload),
};

export const groupeApi = {
  monGroupe: () => api.get("/groupes/mon-groupe"), // MAMAN
  lister: () => api.get("/groupes"), // COORDINATRICE
  obtenir: (id) => api.get(`/groupes/${id}`),
  membres: (id) => api.get(`/groupes/${id}/membres`),
  creer: (payload) => api.post("/groupes", payload),
  constituer: (payload) => api.post("/groupes/constituer", payload),
  ajouterMaman: (groupeId, mamanId) => api.post(`/groupes/${groupeId}/mamans`, { mamanId }),
  retirerMaman: (groupeId, mamanId) => api.delete(`/groupes/${groupeId}/mamans/${mamanId}`),
  modifier: (id, payload) => api.put(`/groupes/${id}`, payload),
  supprimer: (id) => api.delete(`/groupes/${id}`),
};

export const atelierApi = {
  mesAteliers: () => api.get("/ateliers/mes-ateliers"), // PROFESSIONNEL
  monCalendrier: () => api.get("/ateliers/mon-calendrier"), // MAMAN
  ateliersP1P2: () => api.get("/ateliers/p1-p2"), // PARTENAIRE / COORDINATRICE
  // Vue admin (COORDINATRICE)
  lister: (page = 0, size = 20) => api.get(`/ateliers?page=${page}&size=${size}`),
  obtenir: (id) => api.get(`/ateliers/${id}`),
  creer: (payload) => api.post("/ateliers", payload),
  modifier: (id, payload) => api.put(`/ateliers/${id}`, payload),
  supprimer: (id) => api.delete(`/ateliers/${id}`),
  // Inscriptions
  sInscrire: (atelierId) => api.post(`/ateliers/${atelierId}/inscriptions`),
  seDesinscrire: (atelierId) => api.delete(`/ateliers/${atelierId}/inscriptions/moi`),
  listerInscrits: (atelierId) => api.get(`/ateliers/${atelierId}/inscriptions`),
};

export const messageApi = {
  filGroupe: (groupeId) => api.get(`/messages/groupe/${groupeId}`),
  envoyer: (groupeId, contenu) => api.post(`/messages/groupe/${groupeId}`, { contenu }),
  supprimer: (groupeId, messageId) => api.delete(`/messages/groupe/${groupeId}/${messageId}`),
  marquerLuGroupe: (groupeId) => api.post(`/messages/groupe/${groupeId}/marquer-lu`),
  nonLusGroupe: (groupeId) => api.get(`/messages/groupe/${groupeId}/non-lus`),
  conversation: (conversationId) => api.get(`/messages/conversation/${conversationId}`),
  envoyerConversation: (conversationId, contenu) => api.post(`/messages/conversation/${conversationId}`, { contenu }),
  marquerLuConversation: (conversationId) => api.post(`/messages/conversation/${conversationId}/marquer-lu`),
  nonLusConversation: (conversationId) => api.get(`/messages/conversation/${conversationId}/non-lus`),
};

export const questionnaireModeleApi = {
  lister: () => api.get("/questionnaire-modeles"), // COORDINATRICE
  listerActifs: () => api.get("/questionnaire-modeles/actifs"),
  creer: (payload) => api.post("/questionnaire-modeles", payload),
  activer: (id) => api.put(`/questionnaire-modeles/${id}/activer`),
  desactiver: (id) => api.put(`/questionnaire-modeles/${id}/desactiver`),
  listerQuestions: (modeleId) => api.get(`/questionnaire-modeles/${modeleId}/questions`),
  ajouterQuestion: (modeleId, payload) => api.post(`/questionnaire-modeles/${modeleId}/questions`, payload),
  supprimerQuestion: (questionId) => api.delete(`/questionnaire-modeles/questions/${questionId}`),
};

export const compteRenduApi = {
  rediger: (payload) => api.post("/comptes-rendus", payload), // PROFESSIONNEL
  mesComptesRendus: () => api.get("/comptes-rendus/mes-comptes-rendus"), // PROFESSIONNEL
  listerTout: (page = 0, size = 20) => api.get(`/comptes-rendus?page=${page}&size=${size}`), // COORDINATRICE
};

export const promPremApi = {
  soumettre: (payload) => api.post("/prom-prem", payload), // MAMAN
  mesReponses: () => api.get("/prom-prem/mes-reponses"), // MAMAN
  parMaman: (mamanId) => api.get(`/prom-prem/maman/${mamanId}`), // PROFESSIONNEL suivi / COORDINATRICE
  listerTout: (page = 0, size = 20) => api.get(`/prom-prem?page=${page}&size=${size}`), // COORDINATRICE
};

export const conventionApi = {
  maConvention: () => api.get("/conventions/ma-convention"), // PROFESSIONNEL
  lister: () => api.get("/conventions"), // COORDINATRICE
  creer: (payload) => api.post("/conventions", payload),
  modifier: (id, payload) => api.put(`/conventions/${id}`, payload),
  supprimer: (id) => api.delete(`/conventions/${id}`),
};

export const dossierApi = {
  lister: (page = 0, size = 20) => api.get(`/dossiers?page=${page}&size=${size}`),
  obtenir: (id) => api.get(`/dossiers/${id}`),
  genererPourUtilisateur: (utilisateurId) => api.post(`/dossiers/utilisateur/${utilisateurId}/generer`),
};