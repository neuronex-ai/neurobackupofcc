import { supabase } from '@/integrations/supabase/client';

declare global { interface Window { firebase?: any } }

const db = supabase as any;
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const;

function getMissingFirebaseConfig() {
  return requiredConfigKeys.filter((key) => !config[key]);
}

async function assertPushEnvironment() {
  if (!window.isSecureContext) {
    throw new Error('Notificacoes nativas exigem HTTPS ou localhost.');
  }
  if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
    throw new Error('Configure VITE_FIREBASE_VAPID_KEY para ativar notificacoes nativas.');
  }
  const missingConfig = getMissingFirebaseConfig();
  if (missingConfig.length > 0) {
    throw new Error(`Configure Firebase Web Push: ${missingConfig.join(', ')}.`);
  }
}

const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
  const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === 'true') return resolve();
  const script = existing || document.createElement('script');
  script.src = src; script.async = true;
  script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
  script.onerror = () => reject(new Error('Não foi possível carregar o serviço de notificações.'));
  if (!existing) document.head.appendChild(script);
});

const getMessagingClient = async () => {
  await loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  await loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  const firebase = window.firebase;
  if (!firebase) throw new Error('Firebase não foi inicializado.');
  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
  if (firebase.messaging?.isSupported) {
    const supported = await firebase.messaging.isSupported();
    if (!supported) throw new Error('Notificacoes nativas nao sao suportadas neste navegador.');
  }
  return app.messaging();
};

const serviceWorkerUrl = () => `/firebase-messaging-sw.js?${new URLSearchParams(Object.entries(config).map(([key, value]) => [key, value || '']))}`;

const deviceInfo = () => {
  const agent = navigator.userAgent;
  const browser = /Edg/i.test(agent) ? 'Edge' : /Chrome/i.test(agent) ? 'Chrome' : /Firefox/i.test(agent) ? 'Firefox' : /Safari/i.test(agent) ? 'Safari' : 'Outro';
  const deviceId = localStorage.getItem('neuronex_device_id') || crypto.randomUUID();
  localStorage.setItem('neuronex_device_id', deviceId);
  return { device_name: `${browser} em ${navigator.platform || 'dispositivo'}`, browser, platform: navigator.platform || 'unknown', device_id: deviceId };
};

export const enablePushNotifications = async (userId: string) => {
  if (!('serviceWorker' in navigator) || typeof Notification === 'undefined') throw new Error('Notificacoes nativas nao sao suportadas neste dispositivo.');
  await assertPushEnvironment();
  if (Notification.permission === 'denied') {
    throw new Error('As notificacoes estao bloqueadas. Libere a permissao no navegador e tente novamente.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('A permissao de notificacoes nao foi concedida.');
  const registration = await navigator.serviceWorker.register(serviceWorkerUrl()).catch((error) => {
    throw new Error(error instanceof Error ? `Falha ao registrar notificacoes: ${error.message}` : 'Falha ao registrar notificacoes nativas.');
  });
  await registration.update().catch(() => undefined);
  const messaging = await getMessagingClient();
  const token = await messaging.getToken({ vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('O navegador nao retornou um token de notificacao.');
  const { error } = await db.from('push_subscriptions').upsert({ user_id: userId, fcm_token: token, ...deviceInfo(), enabled: true, permission: 'granted', last_seen_at: new Date().toISOString() }, { onConflict: 'user_id,fcm_token' });
  if (error) throw error;
  return token as string;
};

export const disablePushNotifications = async (userId: string) => {
  const messaging = await getMessagingClient().catch(() => null);
  if (messaging) await messaging.deleteToken().catch(() => false);
  const deviceId = localStorage.getItem('neuronex_device_id');
  let query = db.from('push_subscriptions').update({ enabled: false, permission: typeof Notification === 'undefined' ? 'default' : Notification.permission }).eq('user_id', userId);
  if (deviceId) query = query.eq('device_id', deviceId);
  const { error } = await query;
  if (error) throw error;
};

export const listenForForegroundPush = async (handler: (title: string, body: string, actionUrl?: string) => void) => {
  const messaging = await getMessagingClient();
  return messaging.onMessage((payload: any) => handler(payload.notification?.title || 'NeuroNex', payload.notification?.body || 'Nova atualização.', payload.data?.actionUrl));
};
