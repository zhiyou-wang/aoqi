import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { PRESETS } from '../lib/wallpaper';
import type { WallpaperApi } from '../lib/useWallpaper';

interface WallpaperSwitcherProps {
  wallpaper: WallpaperApi;
}

/** 视频缩略图：只取首帧（preload metadata，不下载整片） */
function VideoThumb({ src }: { src: string }) {
  return <video src={src} muted preload="metadata" playsInline tabIndex={-1} />;
}

function WallpaperIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4.5" width="18" height="15" rx="3" />
      <circle cx="8.5" cy="9.5" r="1.4" />
      <path d="m4 17 4.5-4.5 3.5 3.5 3-3L20 17" />
    </svg>
  );
}

/**
 * 更换壁纸：左下角悬浮玻璃按钮，点开液态玻璃面板。
 * - 预设缩略图网格（选中蓝框 + 对勾）
 * - 上传本地图片 / 视频（自定义持久化在 IndexedDB）
 * - 一键恢复默认；外部点击 / Esc 关闭
 */
export function WallpaperSwitcher({ wallpaper }: WallpaperSwitcherProps) {
  const { choice, bg, selectPreset, uploadCustom, reset } = wallpaper;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 外部点击 / Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadCustom(file);
      setOpen(false);
    }
    e.target.value = '';
  };

  const isPresetActive = (id: string) => choice.kind === 'preset' && choice.id === id;

  return (
    <div className={`wp${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="wp__fab aq-glass"
        aria-label="更换壁纸"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <WallpaperIcon />
      </button>

      <div className="wp__panel aq-glass" role="dialog" aria-label="选择壁纸">
        <div className="wp__head">
          <span className="wp__title">壁纸</span>
          <button type="button" className="wp__reset" onClick={reset}>
            恢复默认
          </button>
        </div>

        <div className="wp__grid">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`wp__item${isPresetActive(p.id) ? ' is-selected' : ''}`}
              onClick={() => selectPreset(p.id)}
            >
              <span className="wp__thumb">
                {p.type === 'video' ? <VideoThumb src={p.src} /> : <img src={p.src} alt="" />}
              </span>
              <span className="wp__name">{p.name}</span>
              {isPresetActive(p.id) && (
                <span className="wp__check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}

          {choice.kind === 'custom' && bg && (
            <button type="button" className="wp__item is-selected">
              <span className="wp__thumb">
                {bg.type === 'video' ? (
                  <VideoThumb src={bg.src} />
                ) : (
                  <img src={bg.src} alt="" />
                )}
              </span>
              <span className="wp__name">我的壁纸</span>
              <span className="wp__check" aria-hidden="true">
                ✓
              </span>
            </button>
          )}
        </div>

        <button type="button" className="wp__upload" onClick={() => fileRef.current?.click()}>
          上传本地图片 / 视频
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={onFile} />
      </div>
    </div>
  );
}
