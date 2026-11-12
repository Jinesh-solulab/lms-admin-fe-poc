import type { Lang } from './types';

/** Thin fetch wrapper for lms-backend. Every response is { success, message, data }. */

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const TOKEN_KEY = 'hs_admin_token';

const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* private mode: keep it in memory only */
    }
  },
};

let token: string | null = storage.get(TOKEN_KEY);
let lang: Lang = 'en';
let onUnauthorized: () => void = () => undefined;

export const session = {
  getToken: () => token,
  setToken(t: string | null) {
    token = t;
    storage.set(TOKEN_KEY, t);
  },
  /** API messages come back in this language (Accept-Language). */
  setLang(l: Lang) {
    lang = l;
  },
  onUnauthorized(fn: () => void) {
    onUnauthorized = fn;
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public errors?: string[],
  ) {
    super(message);
  }
}

export interface ApiResult<T> {
  data: T;
  message: string;
}

type Query = Record<string, string | number | boolean | undefined | null>;

const NETWORK_ERROR: Record<Lang, string> = {
  en: 'Cannot reach the server. Is lms-backend running?',
  ar: 'تعذر الاتصال بالخادم',
  ur: 'سرور سے رابطہ نہیں ہو سکا',
};
const networkError = () => new ApiError(0, NETWORK_ERROR[lang]);

function fail(status: number, json: any, fallback: string): ApiError {
  // A 401 on a logged-in session means the token expired or the user was removed.
  if (status === 401 && token) onUnauthorized();
  const errors: string[] | undefined = Array.isArray(json?.errors) ? json.errors : undefined;
  const msg = json?.message || fallback;
  return new ApiError(status, errors?.length ? `${msg}: ${errors.join(', ')}` : msg, json?.code, errors);
}

export async function call<T>(method: string, path: string, opts: { body?: unknown; query?: Query } = {}): Promise<ApiResult<T>> {
  const url = new URL(API_URL + path, window.location.origin); // also works if VITE_API_URL is relative (/api)
  for (const [k, v] of Object.entries(opts.query || {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = { 'Accept-Language': lang };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body });
  } catch {
    throw networkError();
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) throw fail(res.status, json, res.statusText);
  return { data: json?.data as T, message: json?.message || '' };
}

export const get = async <T>(path: string, query?: Query): Promise<T> => (await call<T>('GET', path, { query })).data;

/** Multipart upload (form field "file") with progress, via XHR because fetch has no upload progress. */
export function upload<T>(path: string, file: File, onProgress?: (percent: number) => void): Promise<ApiResult<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_URL + path);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept-Language', lang);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.success !== false) {
        resolve({ data: json?.data as T, message: json?.message || '' });
      } else {
        reject(fail(xhr.status, json, xhr.statusText || 'Upload failed'));
      }
    };
    xhr.onerror = () => reject(networkError());
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  });
}
