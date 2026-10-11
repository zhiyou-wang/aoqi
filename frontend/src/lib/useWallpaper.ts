import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PRESET_ID,
  PRESETS,
  loadChoice,
  loadCustomBlob,
  saveChoice,
  saveCustomBlob,
  type MediaType,
  type WallpaperChoice,
} from './wallpaper';

/** 解析后的背景：媒体类型 + 可直接使用的地址 */
export interface ResolvedBg {
  type: MediaType;
  src: string;
  key: string;
}

export interface WallpaperApi {
  choice: WallpaperChoice;
  bg: ResolvedBg | null;
  selectPreset: (id: string) => void;
  uploadCustom: (file: File) => void;
  reset: () => void;
}

export function useWallpaper(): WallpaperApi {
  const [choice, setChoice] = useState<WallpaperChoice>({
    kind: 'preset',
    id: DEFAULT_PRESET_ID,
  });
  const [bg, setBg] = useState<ResolvedBg | null>(null);
  const customUrlRef = useRef<string | null>(null);

  const releaseCustom = useCallback(() => {
    if (customUrlRef.current) {
      URL.revokeObjectURL(customUrlRef.current);
      customUrlRef.current = null;
    }
  }, []);

  // 根据选择解析出可渲染的背景
  const resolve = useCallback(
    async (c: WallpaperChoice) => {
      if (c.kind === 'preset') {
        releaseCustom();
        const p = PRESETS.find((x) => x.id === c.id) ?? PRESETS[0];
        setBg({ type: p.type, src: p.src, key: `preset:${p.id}` });
        return;
      }
      const blob = await loadCustomBlob();
      if (blob) {
        releaseCustom();
        const url = URL.createObjectURL(blob);
        customUrlRef.current = url;
        setBg({
          type: blob.type.startsWith('video') ? 'video' : 'image',
          src: url,
          key: 'custom',
        });
      } else {
        // 自定义数据缺失，回退默认
        const fallback: WallpaperChoice = { kind: 'preset', id: DEFAULT_PRESET_ID };
        saveChoice(fallback);
        setChoice(fallback);
        setBg({ type: PRESETS[0].type, src: PRESETS[0].src, key: `preset:${PRESETS[0].id}` });
      }
    },
    [releaseCustom],
  );

  // 初始化：从持久化存储恢复
  useEffect(() => {
    const c = loadChoice();
    setChoice(c);
    void resolve(c);
    return releaseCustom;
  }, [resolve, releaseCustom]);

  const selectPreset = useCallback(
    (id: string) => {
      const c: WallpaperChoice = { kind: 'preset', id };
      setChoice(c);
      saveChoice(c);
      void resolve(c);
    },
    [resolve],
  );

  const uploadCustom = useCallback(
    (file: File) => {
      const c: WallpaperChoice = { kind: 'custom' };
      void saveCustomBlob(file).then(() => {
        setChoice(c);
        saveChoice(c);
        void resolve(c);
      });
    },
    [resolve],
  );

  const reset = useCallback(() => selectPreset(DEFAULT_PRESET_ID), [selectPreset]);

  return { choice, bg, selectPreset, uploadCustom, reset };
}
