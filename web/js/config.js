// Constantes públicas del front. El GOOGLE_CLIENT_ID es público por diseño (va en el navegador).
const localApi = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3001/api'
  : '/api';
export const API = (typeof window !== 'undefined' && window.CAVA_API) || localApi;
// TODO-USUARIO: pega aquí el OAuth Client ID que generes en Google Cloud (Task 5 / guía).
export const GOOGLE_CLIENT_ID =
  (typeof window !== 'undefined' && window.CAVA_GOOGLE_CLIENT_ID) || 'PEGAR_TU_GOOGLE_CLIENT_ID';
