import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Expo Go sur téléphone : ton PC doit être sur le même Wi-Fi.
// Change cette IP si tu changes de réseau (ipconfig → Wi-Fi → Adresse IPv4).
const BASE_URL = "http://192.168.1.49:8081/api";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("mino_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const estLogin = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !estLogin) {
      await SecureStore.deleteItemAsync("mino_token");
      await SecureStore.deleteItemAsync("mino_user");
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (email, motDePasse) => api.post("/auth/login", { email, motDePasse }),
  mettreAJourProfil: (payload) => api.put("/auth/mon-profil", payload),
  changerMotDePasse: (ancienMotDePasse, nouveauMotDePasse) =>
    api.put("/auth/changer-mot-de-passe", { ancienMotDePasse, nouveauMotDePasse }),
};

export const atelierApi = {
  mesAteliers: () => api.get("/ateliers/mes-ateliers"),
  monCalendrier: () => api.get("/ateliers/mon-calendrier"),
  ateliersP1P2: () => api.get("/ateliers/p1-p2"),
  lister: (page = 0, size = 20) => api.get(`/ateliers?page=${page}&size=${size}`),
  obtenir: (id) => api.get(`/ateliers/${id}`),
  creer: (payload) => api.post("/ateliers", payload),
  modifier: (id, payload) => api.put(`/ateliers/${id}`, payload),
  supprimer: (id) => api.delete(`/ateliers/${id}`),
  sInscrire: (atelierId) => api.post(`/ateliers/${atelierId}/inscriptions`),
  seDesinscrire: (atelierId) => api.delete(`/ateliers/${atelierId}/inscriptions/moi`),
  listerInscrits: (atelierId) => api.get(`/ateliers/${atelierId}/inscriptions`),
};

export const messageApi = {
  filGroupe: (groupeId) => api.get(`/messages/groupe/${groupeId}`),
  envoyer: (groupeId, contenu) => api.post(`/messages/groupe/${groupeId}`, { contenu }),
  marquerLuGroupe: (groupeId) => api.post(`/messages/groupe/${groupeId}/marquer-lu`),
  nonLusGroupe: (groupeId) => api.get(`/messages/groupe/${groupeId}/non-lus`),
  conversation: (id) => api.get(`/messages/conversation/${id}`),
  envoyerConversation: (id, contenu) => api.post(`/messages/conversation/${id}`, { contenu }),
  marquerLuConversation: (id) => api.post(`/messages/conversation/${id}/marquer-lu`),
  nonLusConversation: (id) => api.get(`/messages/conversation/${id}/non-lus`),
};

export const messagePriveApi = {
  conversation: (autreId) => api.get(`/messages/prive/${autreId}`),
  envoyer: (autreId, contenu) => api.post(`/messages/prive/${autreId}`, { contenu }),
  marquerLu: (autreId) => api.post(`/messages/prive/${autreId}/marquer-lu`),
  nonLusTotal: () => api.get("/messages/prive/non-lus-total"),
};

export const mamanApi = {
  monParcours: () => api.get("/maman/parcours"),
  mettreAJourParcours: (payload) => api.put("/maman/parcours", payload),
};

export const groupeApi = {
  monGroupe: () => api.get("/groupes/mon-groupe"),
  lister: () => api.get("/groupes"),
  obtenir: (id) => api.get(`/groupes/${id}`),
  membres: (id) => api.get(`/groupes/${id}/membres`),
  creer: (payload) => api.post("/groupes", payload),
  constituer: (payload) => api.post("/groupes/constituer", payload),
  ajouterMaman: (groupeId, mamanId) => api.post(`/groupes/${groupeId}/mamans`, { mamanId }),
  retirerMaman: (groupeId, mamanId) => api.delete(`/groupes/${groupeId}/mamans/${mamanId}`),
  modifier: (id, payload) => api.put(`/groupes/${id}`, payload),
  supprimer: (id) => api.delete(`/groupes/${id}`),
};

export const compteRenduApi = {
  rediger: (payload) => api.post("/comptes-rendus", payload),
  mesComptesRendus: () => api.get("/comptes-rendus/mes-comptes-rendus"),
  listerTout: (page = 0, size = 20) => api.get(`/comptes-rendus?page=${page}&size=${size}`),
};

export const evaluationApi = {
  soumettre: (payload) => api.post("/evaluations", payload),
  ateliersAEvaluer: () => api.get("/evaluations/a-evaluer"),
  parAtelier: (atelierId) => api.get(`/evaluations/atelier/${atelierId}`),
  synthese: () => api.get("/evaluations/synthese"),
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

export const conventionApi = {
  maConvention: () => api.get("/conventions/ma-convention"),
  lister: () => api.get("/conventions"),
  creer: (payload) => api.post("/conventions", payload),
  modifier: (id, payload) => api.put(`/conventions/${id}`, payload),
  supprimer: (id) => api.delete(`/conventions/${id}`),
};

export const cohorteApi = {
  lister: () => api.get("/cohortes"),
  obtenir: (id) => api.get(`/cohortes/${id}`),
  creer: (payload) => api.post("/cohortes", payload),
  modifier: (id, payload) => api.put(`/cohortes/${id}`, payload),
  supprimer: (id) => api.delete(`/cohortes/${id}`),
  mamansEnAttente: (id) => api.get(`/cohortes/${id}/mamans-en-attente`),
};

export const promPremApi = {
  soumettre: (payload) => api.post("/prom-prem", payload),
  mesReponses: () => api.get("/prom-prem/mes-reponses"),
  listerTout: (page = 0, size = 20) => api.get(`/prom-prem?page=${page}&size=${size}`),
};

export const questionnaireModeleApi = {
  lister: () => api.get("/questionnaire-modeles"),
  listerActifs: () => api.get("/questionnaire-modeles/actifs"),
  creer: (payload) => api.post("/questionnaire-modeles", payload),
  activer: (id) => api.put(`/questionnaire-modeles/${id}/activer`),
  desactiver: (id) => api.put(`/questionnaire-modeles/${id}/desactiver`),
  listerQuestions: (modeleId) => api.get(`/questionnaire-modeles/${modeleId}/questions`),
  ajouterQuestion: (modeleId, payload) => api.post(`/questionnaire-modeles/${modeleId}/questions`, payload),
  supprimerQuestion: (questionId) => api.delete(`/questionnaire-modeles/questions/${questionId}`),
};

export const dossierApi = {
  lister: (page = 0, size = 20) => api.get(`/dossiers?page=${page}&size=${size}`),
  obtenir: (id) => api.get(`/dossiers/${id}`),
  genererPourUtilisateur: (utilisateurId) => api.post(`/dossiers/utilisateur/${utilisateurId}/generer`),
};
