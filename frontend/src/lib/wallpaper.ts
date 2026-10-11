/**
 * 壁纸：预设 + 自定义上传。
 * - 当前选择（预设 id / 自定义）存 localStorage。
 * - 自定义图片体积大，localStorage 放不下，blob 存 IndexedDB。
 */

export type MediaType = 'image' | 'video';

export interface Preset {
  id: string;
  name: string;
  src: string;
  type: MediaType;
}

/** 预设壁纸（第一张为默认） */
export const PRESETS: Preset[] = [
  { id: 'default', name: '默认', src: '/wallpapers/default.png', type: 'image' },
  { id: 'cloud-static', name: '云端乐园·静', src: '/wallpapers/cloud-static.webp', type: 'image' },
  { id: 'cloud-motion', name: '云端乐园·动', src: '/bg-sunshangxiang.mp4', type: 'video' },
];

export const DEFAULT_PRESET_ID = 'default';

export type WallpaperChoice =
  | { kind: 'preset'; id: string }
  | { kind: 'custom' };

const LS_KEY = 'aoqi.wallpaper';
const DB_NAME = 'aoqi-wallpaper';
const DB_STORE = 'kv';
const CUSTOM_KEY = 'custom';

/* ---------------- localStorage：当前选择 ---------------- */

export function loadChoice(): WallpaperChoice {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WallpaperChoice;
      if (parsed.kind === 'custom') return parsed;
      if (parsed.kind === 'preset' && PRESETS.some((p) => p.id === parsed.id)) {
        return parsed;
      }
    }
  } catch {
    /* 读取失败则用默认 */
  }
  return { kind: 'preset', id: DEFAULT_PRESET_ID };
}

export function saveChoice(choice: WallpaperChoice): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(choice));
  } catch {
    /* 忽略写入失败 */
  }
}

/* ---------------- IndexedDB：自定义图片 blob ---------------- */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(key: IDBValidKey): Promise<unknown> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(key);
        req.onsuccess = () => {
          resolve(req.result);
          db.close();
        };
        req.onerror = () => {
          reject(req.error);
          db.close();
        };
      }),
  );
}

function idbPut(key: IDBValidKey, value: unknown): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(value, key);
        tx.oncomplete = () => {
          resolve();
          db.close();
        };
        tx.onerror = () => {
          reject(tx.error);
          db.close();
        };
      }),
  );
}

export async function loadCustomBlob(): Promise<Blob | null> {
  try {
    const v = await idbGet(CUSTOM_KEY);
    return v instanceof Blob ? v : null;
  } catch {
    return null;
  }
}

export async function saveCustomBlob(blob: Blob): Promise<void> {
  await idbPut(CUSTOM_KEY, blob);
}
