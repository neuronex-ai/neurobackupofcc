import type { Session } from "@supabase/supabase-js";

type BridgeResult<T = unknown> = T | Promise<T>;

type NativeBridge = {
  getBiometricStatus?: (payload?: unknown) => BridgeResult<unknown>;
  authenticateBiometric?: (payload?: unknown) => BridgeResult<unknown>;
  secureStorageGet?: (payload: unknown) => BridgeResult<unknown>;
  secureStorageSet?: (payload: unknown) => BridgeResult<unknown>;
  secureStorageRemove?: (payload: unknown) => BridgeResult<unknown>;
  scanCode?: (payload: unknown) => BridgeResult<unknown>;
};

type NativeWindow = Window & {
  NeuroNexAndroid?: NativeBridge;
  Capacitor?: {
    Plugins?: Record<string, NativeBridge>;
    getPlatform?: () => string;
    isNativePlatform?: () => boolean;
  };
};

export type BiometricStatus = {
  available: boolean;
  enrolled: boolean;
  supported: boolean;
  native: boolean;
  biometryType?: string | null;
  reason?: string | null;
};

export type StoredBiometricAccount = {
  userId: string;
  email?: string | null;
  enabledAt: string;
};

export type BiometricPreference = "enabled" | "disabled" | "unset";

const BIOMETRIC_ACCOUNT_KEY = "neuronex.biometric.account.v1";
const BIOMETRIC_PREFERENCE_PREFIX = "neuronex.biometric.preference.v1";
const BIOMETRIC_ENABLED_PREFIX = "neuronex.biometric.enabled.v1";
const BIOMETRIC_SESSION_PREFIX = "neuronex.biometric.session.v1";
const FINANCIAL_PIN_PREFIX = "neuronex.financial-pin.v1";
const SUPABASE_AUTH_TOKEN_SUFFIX = "-auth-token";

let authVaultUnlocked = false;

function getNativeBridge(): NativeBridge | null {
  if (typeof window === "undefined") return null;
  const nativeWindow = window as NativeWindow;
  return (
    nativeWindow.Capacitor?.Plugins?.NeuroNexSecure ||
    nativeWindow.Capacitor?.Plugins?.NeuroNexNative ||
    nativeWindow.NeuroNexAndroid ||
    null
  );
}

async function normalizeNativeResult<T>(result: unknown): Promise<T | null> {
  const resolved = await result;
  if (typeof resolved === "string") {
    try {
      return JSON.parse(resolved) as T;
    } catch {
      return resolved as T;
    }
  }
  return (resolved ?? null) as T | null;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function localGet(key: string) {
  if (!canUseLocalStorage()) return null;
  return window.localStorage.getItem(key);
}

function localSet(key: string, value: string) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(key, value);
}

function localRemove(key: string) {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(key);
}

function keyWithUser(prefix: string, userId: string) {
  return `${prefix}:${userId}`;
}

function isSupabaseAuthTokenKey(key: string) {
  return key.endsWith(SUPABASE_AUTH_TOKEN_SUFFIX);
}

function readSessionFromAuthStorageValue(value: string) {
  try {
    const parsed = JSON.parse(value) as Partial<Session> & {
      currentSession?: Partial<Session>;
    };
    const session = parsed.currentSession || parsed;
    if (!session.access_token || !session.refresh_token) return null;
    return session;
  } catch {
    return null;
  }
}

async function syncBiometricSessionFromAuthValue(value: string) {
  const account = getStoredBiometricAccount();
  if (!account || !isBiometricEnabledForUser(account.userId)) return;

  const session = readSessionFromAuthStorageValue(value);
  if (!session) return;

  await secureSet(
    keyWithUser(BIOMETRIC_SESSION_PREFIX, account.userId),
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
    }),
    { requireAuthentication: true },
  );
}

async function clearBiometricSessionAfterSignOut() {
  const account = getStoredBiometricAccount();
  if (!account) return;

  await secureRemove(keyWithUser(BIOMETRIC_SESSION_PREFIX, account.userId));
  await secureRemove(keyWithUser(FINANCIAL_PIN_PREFIX, account.userId));
  localRemove(keyWithUser(BIOMETRIC_ENABLED_PREFIX, account.userId));
  localRemove(BIOMETRIC_ACCOUNT_KEY);
}

async function secureGet(key: string, options?: Record<string, unknown>) {
  const bridge = getNativeBridge();
  if (bridge?.secureStorageGet) {
    const result = await normalizeNativeResult<{ value?: string | null } | string>(
      bridge.secureStorageGet({ key, ...options }),
    );
    if (typeof result === "string") return result;
    return result?.value ?? null;
  }
  return localGet(key);
}

async function secureSet(key: string, value: string, options?: Record<string, unknown>) {
  const bridge = getNativeBridge();
  if (bridge?.secureStorageSet) {
    await bridge.secureStorageSet({ key, value, ...options });
    return;
  }
  localSet(key, value);
}

async function secureRemove(key: string) {
  const bridge = getNativeBridge();
  if (bridge?.secureStorageRemove) {
    await bridge.secureStorageRemove({ key });
    return;
  }
  localRemove(key);
}

export function hasNativeSecureBridge() {
  const bridge = getNativeBridge();
  return Boolean(
    bridge?.secureStorageGet &&
      bridge.secureStorageSet &&
      bridge.secureStorageRemove &&
      bridge.getBiometricStatus &&
      bridge.authenticateBiometric,
  );
}

export function hasNativeCodeScanner() {
  return Boolean(getNativeBridge()?.scanCode);
}

export async function getBiometricStatus(): Promise<BiometricStatus> {
  const bridge = getNativeBridge();

  if (bridge?.getBiometricStatus) {
    try {
      const result = await normalizeNativeResult<Record<string, unknown>>(
        bridge.getBiometricStatus({ allowDeviceCredential: true }),
      );
      const available = Boolean(result?.available ?? result?.canAuthenticate);
      const enrolled = Boolean(result?.enrolled ?? result?.hasEnrolledBiometrics ?? available);
      return {
        available,
        enrolled,
        supported: Boolean(result?.supported ?? available),
        native: true,
        biometryType: String(result?.biometryType || result?.type || "biometric"),
        reason: typeof result?.reason === "string" ? result.reason : null,
      };
    } catch (error) {
      return {
        available: false,
        enrolled: false,
        supported: true,
        native: true,
        reason:
          error instanceof Error
            ? error.message
            : "Nao foi possivel verificar a biometria deste aparelho.",
      };
    }
  }

  return {
    available: false,
    enrolled: false,
    supported: false,
    native: false,
    reason: "Biometria nativa indisponivel neste ambiente.",
  };
}

export async function authenticateWithBiometrics(reason: string) {
  const bridge = getNativeBridge();
  if (!bridge?.authenticateBiometric) {
    throw new Error("Biometria nativa indisponivel neste dispositivo.");
  }

  const result = await normalizeNativeResult<Record<string, unknown>>(
    bridge.authenticateBiometric({
      title: "NeuroNex",
      subtitle: reason,
      description: "Confirme sua identidade com biometria ou bloqueio do aparelho.",
      negativeButtonText: "Usar senha",
      allowDeviceCredential: true,
      confirmationRequired: true,
    }),
  );

  if (result && result.success === false) {
    throw new Error(String(result.reason || result.error || "Biometria nao confirmada."));
  }

  return true;
}

export function getStoredBiometricAccount(): StoredBiometricAccount | null {
  const raw = localGet(BIOMETRIC_ACCOUNT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredBiometricAccount;
    return parsed?.userId ? parsed : null;
  } catch {
    return null;
  }
}

export function isBiometricEnabledForUser(userId?: string | null) {
  if (!userId) return false;
  return localGet(keyWithUser(BIOMETRIC_ENABLED_PREFIX, userId)) === "true";
}

export function getBiometricPreferenceForUser(userId?: string | null): BiometricPreference {
  if (!userId) return "unset";
  const value = localGet(keyWithUser(BIOMETRIC_PREFERENCE_PREFIX, userId));
  return value === "enabled" || value === "disabled" ? value : "unset";
}

function setBiometricPreferenceForUser(userId: string, preference: Exclude<BiometricPreference, "unset">) {
  localSet(keyWithUser(BIOMETRIC_PREFERENCE_PREFIX, userId), preference);
}

export async function enableBiometricSignIn(params: {
  userId: string;
  email?: string | null;
  session: Session;
}) {
  if (!hasNativeSecureBridge()) {
    throw new Error("Cofre nativo Android indisponivel neste ambiente.");
  }

  const status = await getBiometricStatus();
  if (!status.native || !status.available || !status.enrolled) {
    throw new Error(
      status.reason ||
        "Este aparelho ainda nao tem biometria ou bloqueio seguro configurado.",
    );
  }

  await authenticateWithBiometrics("Ativar Entrar com biometria");

  const account: StoredBiometricAccount = {
    userId: params.userId,
    email: params.email,
    enabledAt: new Date().toISOString(),
  };

  localSet(BIOMETRIC_ACCOUNT_KEY, JSON.stringify(account));
  localSet(keyWithUser(BIOMETRIC_ENABLED_PREFIX, params.userId), "true");
  setBiometricPreferenceForUser(params.userId, "enabled");

  await secureSet(
    keyWithUser(BIOMETRIC_SESSION_PREFIX, params.userId),
    JSON.stringify({
      access_token: params.session.access_token,
      refresh_token: params.session.refresh_token,
      expires_at: params.session.expires_at,
      expires_in: params.session.expires_in,
      token_type: params.session.token_type,
    }),
    { requireAuthentication: true },
  );

  authVaultUnlocked = true;
}

export async function disableBiometricSignIn(userId: string) {
  await secureRemove(keyWithUser(BIOMETRIC_SESSION_PREFIX, userId));
  await secureRemove(keyWithUser(FINANCIAL_PIN_PREFIX, userId));
  localRemove(keyWithUser(BIOMETRIC_ENABLED_PREFIX, userId));
  setBiometricPreferenceForUser(userId, "disabled");

  const account = getStoredBiometricAccount();
  if (account?.userId === userId) {
    localRemove(BIOMETRIC_ACCOUNT_KEY);
  }
}

export async function restoreBiometricSession() {
  if (!hasNativeSecureBridge()) {
    throw new Error("Biometria nativa indisponivel. Entre com e-mail e senha.");
  }

  const account = getStoredBiometricAccount();
  if (!account || !isBiometricEnabledForUser(account.userId)) {
    throw new Error("Biometria nao esta ativa neste dispositivo.");
  }

  const status = await getBiometricStatus();
  if (!status.native || !status.available || !status.enrolled) {
    throw new Error(
      status.reason ||
        "Biometria indisponivel. Entre com e-mail e senha para continuar.",
    );
  }

  await authenticateWithBiometrics("Entrar no NeuroNex");
  authVaultUnlocked = true;

  const raw = await secureGet(keyWithUser(BIOMETRIC_SESSION_PREFIX, account.userId));
  if (!raw) {
    throw new Error("Sessao biometrica nao encontrada. Entre com e-mail e senha.");
  }

  return {
    account,
    session: JSON.parse(raw) as Pick<
      Session,
      "access_token" | "refresh_token" | "expires_at" | "expires_in" | "token_type"
    >,
  };
}

export async function canUseBiometricTransaction(userId?: string | null) {
  if (!hasNativeSecureBridge()) return false;
  if (!userId || !isBiometricEnabledForUser(userId)) return false;
  const status = await getBiometricStatus();
  return status.native && status.available && status.enrolled;
}

export async function getFinancialPinWithBiometrics(params: {
  userId: string;
  reason: string;
}) {
  if (!(await canUseBiometricTransaction(params.userId))) {
    throw new Error("Biometria nao esta ativa para transacoes neste dispositivo.");
  }

  await authenticateWithBiometrics(params.reason);
  const raw = await secureGet(keyWithUser(FINANCIAL_PIN_PREFIX, params.userId), {
    requireAuthentication: true,
  });
  if (!raw) {
    throw new Error("Digite o PIN uma vez para liberar o uso com biometria.");
  }
  return raw;
}

export async function rememberFinancialPinForBiometrics(userId: string, pin: string) {
  if (!/^\d{6}$/.test(pin) || !(await canUseBiometricTransaction(userId))) return;
  await secureSet(keyWithUser(FINANCIAL_PIN_PREFIX, userId), pin, {
    requireAuthentication: true,
  });
}

export async function forgetFinancialPinForBiometrics(userId: string) {
  await secureRemove(keyWithUser(FINANCIAL_PIN_PREFIX, userId));
}

export async function scanCodeWithNative(params: {
  mode: "pix" | "boleto";
}): Promise<string | null> {
  const bridge = getNativeBridge();
  if (!bridge?.scanCode) return null;

  const result = await normalizeNativeResult<Record<string, unknown> | string>(
    bridge.scanCode({
      formats:
        params.mode === "pix"
          ? ["QR_CODE"]
          : ["ITF", "CODE_128", "CODABAR"],
      prompt:
        params.mode === "pix"
          ? "Aponte a camera para o QR Code Pix."
          : "Aponte a camera para as barras horizontais do boleto.",
      useMlKit: true,
      useCameraX: true,
    }),
  );

  if (typeof result === "string") return result;
  if (typeof result?.value === "string") return result.value;
  if (typeof result?.rawValue === "string") return result.rawValue;
  return null;
}

export function createSupabaseAuthStorage() {
  return {
    getItem: async (key: string) => {
      if (
        isSupabaseAuthTokenKey(key) &&
        getStoredBiometricAccount() &&
        !authVaultUnlocked
      ) {
        return null;
      }
      return secureGet(key);
    },
    setItem: async (key: string, value: string) => {
      await secureSet(key, value);
      if (isSupabaseAuthTokenKey(key)) {
        await syncBiometricSessionFromAuthValue(value).catch(() => undefined);
      }
    },
    removeItem: async (key: string) => {
      await secureRemove(key);
      if (isSupabaseAuthTokenKey(key)) {
        await clearBiometricSessionAfterSignOut().catch(() => undefined);
      }
    },
  };
}
