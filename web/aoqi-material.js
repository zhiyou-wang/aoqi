/* ============================================================
   奥奇传说 · 材质系统 JS
   超椭圆裁切 / 位移透镜 / 冲击帧 / 磨砂
   配套 aoqi-material.css
   ============================================================ */
(function (global) {
  'use strict';

  const SVGNS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';

  /* ---------- 数学工具 ---------- */

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function smoothstep(a, b, t) {
    const x = clamp((t - a) / (b - a), 0, 1);
    return x * x * (3 - 2 * x);
  }

  /* 2D 值噪声（带 seed），用于分形噪声场 */
  function valueNoise2D(seed) {
    const s = seed || 7;
    function hash(ix, iy) {
      const n = Math.sin(ix * 127.1 + iy * 311.7 + s * 74.7) * 43758.5453;
      return n - Math.floor(n);
    }
    function fade(t) {
      return t * t * (3 - 2 * t);
    }
    return function (x, y) {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;
      const a = hash(xi, yi);
      const b = hash(xi + 1, yi);
      const c = hash(xi, yi + 1);
      const d = hash(xi + 1, yi + 1);
      const u = fade(xf);
      const v = fade(yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }

  /* 构建 SVG feDisplacementMap 滤镜，返回 filter id。
     dataUrl: 位移图（R/G 通道存 X/Y 位移）；scale: 位移强度 */
  function buildDisplacementFilter(id, w, h, dataUrl, scale) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';

    const defs = document.createElementNS(SVGNS, 'defs');
    const filter = document.createElementNS(SVGNS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', String(w));
    filter.setAttribute('height', String(h));

    const feImage = document.createElementNS(SVGNS, 'feImage');
    feImage.setAttribute('result', 'map');
    feImage.setAttribute('width', String(w));
    feImage.setAttribute('height', String(h));

    const feDisp = document.createElementNS(SVGNS, 'feDisplacementMap');
    feDisp.setAttribute('in', 'SourceGraphic');
    feDisp.setAttribute('in2', 'map');
    feDisp.setAttribute('xChannelSelector', 'R');
    feDisp.setAttribute('yChannelSelector', 'G');
    feDisp.setAttribute('scale', String(scale));

    filter.appendChild(feImage);
    filter.appendChild(feDisp);
    defs.appendChild(filter);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    feImage.setAttributeNS(XLINK, 'href', dataUrl);
    feImage.setAttribute('href', dataUrl);
    return id;
  }

  /* 构建带色散的折射滤镜。
     dataUrl: 基准位移图；scale: 位移强度；dispersion: 色散像素（0 关闭）
     原理：R 通道折射弱一点、B 通道折射强一点（对应 N_R<N_G<N_B），
     合成后边缘出现红青分离。 */
  function buildLensFilter(id, w, h, dataUrl, scale, dispersion) {
    const d = dispersion || 0;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';

    const N = (tag, attrs) => {
      const n = document.createElementNS(SVGNS, tag);
      Object.keys(attrs).forEach((k) => n.setAttribute(k, String(attrs[k])));
      return n;
    };

    const defs = document.createElementNS(SVGNS, 'defs');
    const filter = N('filter', {
      id, filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB',
      x: '0', y: '0', width: String(w), height: String(h),
    });

    filter.appendChild(N('feImage', {
      result: 'map', width: String(w), height: String(h),
    }));

    if (d > 0.01) {
      // 三通道不同 scale，模拟色散
      const rScale = Math.max(0, parseFloat(scale) - d * 0.6);
      const bScale = parseFloat(scale) + d * 0.6;

      filter.appendChild(N('feDisplacementMap', {
        in: 'SourceGraphic', in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G',
        scale: String(rScale), result: 'refrR',
      }));
      filter.appendChild(N('feDisplacementMap', {
        in: 'SourceGraphic', in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G',
        scale: String(scale), result: 'refrG',
      }));
      filter.appendChild(N('feDisplacementMap', {
        in: 'SourceGraphic', in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G',
        scale: String(bScale), result: 'refrB',
      }));
      filter.appendChild(N('feColorMatrix', {
        in: 'refrR', type: 'matrix',
        values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'r',
      }));
      filter.appendChild(N('feColorMatrix', {
        in: 'refrG', type: 'matrix',
        values: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'g',
      }));
      filter.appendChild(N('feColorMatrix', {
        in: 'refrB', type: 'matrix',
        values: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', result: 'b',
      }));
      filter.appendChild(N('feBlend', { in: 'r', in2: 'g', mode: 'screen', result: 'rg' }));
      filter.appendChild(N('feBlend', { in: 'rg', in2: 'b', mode: 'screen' }));
    } else {
      filter.appendChild(N('feDisplacementMap', {
        in: 'SourceGraphic', in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G',
        scale: String(scale),
      }));
    }

    svg.appendChild(defs);
    defs.appendChild(filter);
    document.body.appendChild(svg);

    const feImage = svg.querySelector('feImage');
    feImage.setAttributeNS(XLINK, 'href', dataUrl);
    feImage.setAttribute('href', dataUrl);
    return id;
  }

  /* 超椭圆角 SDF（连续圆角）
     px,py: 中心坐标；hx,hy: 半轴；r: 圆角半径；n: 超椭圆指数 */
  function roundedRectSDF(px, py, hx, hy, r, n) {
    const ax = Math.abs(px);
    const ay = Math.abs(py);
    const dx = ax - (hx - r);
    const dy = ay - (hy - r);
    if (dx > 0 && dy > 0) {
      // 角落区域：超椭圆
      const v = Math.pow(Math.pow(dx / r, n) + Math.pow(dy / r, n), 1 / n);
      return (v - 1) * r;
    }
    // 内部与边缘区域
    return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  }

  /* ---------- 超椭圆裁切（clip-path） ---------- */

  function superellipsePoint(cx, cy, r, n, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
      cx + r * Math.sign(cos) * Math.pow(Math.abs(cos), 2 / n),
      cy + r * Math.sign(sin) * Math.pow(Math.abs(sin), 2 / n),
    ];
  }

  /* 按元素实际宽高生成超椭圆 polygon，避免百分比裁切把长边拉弯 */
  function superellipse(el, radius, roundness) {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w < 2 || h < 2) return false;
    const n = roundness || 5;
    const r = Math.min(radius || 24, w / 2, h / 2);
    const steps = 14;
    const corners = [
      [r, r, Math.PI, Math.PI * 1.5],
      [w - r, r, Math.PI * 1.5, Math.PI * 2],
      [w - r, h - r, 0, Math.PI * 0.5],
      [r, h - r, Math.PI * 0.5, Math.PI],
    ];
    const pts = [];
    corners.forEach(([cx, cy, start, end]) => {
      for (let i = 0; i <= steps; i += 1) {
        const a = start + ((end - start) * i) / steps;
        const [x, y] = superellipsePoint(cx, cy, r, n, a);
        pts.push(`${x.toFixed(2)}px ${y.toFixed(2)}px`);
      }
    });
    el.style.clipPath = `polygon(${pts.join(',')})`;
    el.style.borderRadius = '0';
    return true;
  }

  /* ---------- 位移透镜（真折射） ----------
     借鉴 liquid-glass-main / liquid-glass-react-main：
     用 canvas 生成位移图 + SVG feDisplacementMap 做背景折射。
     支持实时调参：thickness 折射厚度 / bulge 边缘鼓起 / dispersion 色散。 */
  function lens(el, opts) {
    opts = opts || {};
    const state = {
      radius: opts.radius || 24,
      roundness: opts.roundness || 5,
      displacement: opts.displacement || 1,
      thickness: opts.thickness != null ? opts.thickness : 0.85,
      bulge: opts.bulge || 0,
      dispersion: opts.dispersion || 0,
    };
    let filterId = null;

    function apply() {
      if (filterId) {
        document.getElementById(filterId)?.remove();
        filterId = null;
      }
      const w = Math.max(2, Math.round(el.offsetWidth));
      const h = Math.max(2, Math.round(el.offsetHeight));
      const radius = state.radius;
      const roundness = state.roundness;
      const displacement = state.displacement;
      const thickness = state.thickness;
      const bulge = state.bulge;
      const dispersion = state.dispersion;
      filterId = 'aq-lens-' + Math.random().toString(36).slice(2, 9);
      const id = filterId;

      // 1. 位移图
      const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const data = img.data;

    const hx = 0.5;
    const hy = 0.5;
    const rr = clamp(radius / Math.min(w, h), 0.02, 0.5);
    const raw = new Float32Array(w * h * 2);
    let maxScale = 0;
    let idx = 0;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const ux = x / w - 0.5;
        const uy = y / h - 0.5;
        const sdf = roundedRectSDF(ux, uy, hx, hy, rr, roundness);
        // 折射带：smoothstep(edge, 0, sdf - band)，thickness 控制带宽度
        const disp = smoothstep(thickness, 0, sdf - (1 - thickness) * 0.28);
        const scaled = smoothstep(0, 1, disp);
        // 中心向心（凸透镜中心放大）+ 边缘鼓起（沿法线再外推）
        const dx = (ux * scaled * w - x) + (ux * bulge * (1 - scaled));
        const dy = (uy * scaled * h - y) + (uy * bulge * (1 - scaled));
        raw[idx] = dx;
        raw[idx + 1] = dy;
        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
        idx += 2;
      }
    }
    maxScale = Math.max(1, maxScale * 0.5);

    idx = 0;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp((raw[idx] / maxScale + 0.5) * 255, 0, 255);
      data[i + 1] = clamp((raw[idx + 1] / maxScale + 0.5) * 255, 0, 255);
      data[i + 2] = 0;
      data[i + 3] = 255;
      idx += 2;
    }
    ctx.putImageData(img, 0, 0);
    const dataUrl = canvas.toDataURL();

      // 2. SVG filter（含色散）
      buildLensFilter(id, w, h, dataUrl, (maxScale * displacement).toFixed(2), dispersion);

      // 3. 应用
      el.style.backdropFilter = `url(#${id}) blur(0.25px) contrast(1.15) brightness(1.05) saturate(1.1)`;
      el.style.webkitBackdropFilter = el.style.backdropFilter;
    }

    apply();

    return {
      get id() {
        return filterId;
      },
      get state() {
        return state;
      },
      update(next) {
        Object.assign(state, next || {});
        apply();
      },
      destroy() {
        if (filterId) document.getElementById(filterId)?.remove();
      },
    };
  }

  /* ---------- 神迹晶体（球面真折射） ----------
     凸透镜球面：中心放大（采样向外扩散），边缘压缩（采样向内，
     在边界处形成球体折射环）。位移图是径向偏移场。 */
  function crystal(el, opts) {
    opts = opts || {};
    const w = Math.max(2, Math.round(el.offsetWidth));
    const h = Math.max(2, Math.round(el.offsetHeight));
    const magnification = opts.magnification || 0.18; // 中心放大强度
    const compression = opts.compression || 0.10;     // 边缘压缩强度
    const displacement = opts.displacement || 0.6;    // 整体位移倍率

    const id = 'aq-crystal-' + Math.random().toString(36).slice(2, 9);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const data = img.data;

    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) / 2;

    const raw = new Float32Array(w * h * 2);
    let maxScale = 0;
    let idx = 0;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.hypot(dx, dy);
        let ox = 0;
        let oy = 0;
        if (r < R && r > 0.5) {
          const t = r / R; // 0..1，0=中心，1=边缘
          // 中心放大 → 边缘压缩 的径向偏移
          const m = magnification * (1 - t) * (1 - t) - compression * t;
          const u = m * R;
          ox = (dx / r) * u;
          oy = (dy / r) * u;
        }
        raw[idx] = ox;
        raw[idx + 1] = oy;
        maxScale = Math.max(maxScale, Math.abs(ox), Math.abs(oy));
        idx += 2;
      }
    }
    maxScale = Math.max(1, maxScale);

    idx = 0;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp((raw[idx] / maxScale + 0.5) * 255, 0, 255);
      data[i + 1] = clamp((raw[idx + 1] / maxScale + 0.5) * 255, 0, 255);
      data[i + 2] = 0;
      data[i + 3] = 255;
      idx += 2;
    }
    ctx.putImageData(img, 0, 0);
    const dataUrl = canvas.toDataURL();

    buildDisplacementFilter(id, w, h, dataUrl, (maxScale * displacement).toFixed(2));

    el.style.backdropFilter = `url(#${id}) blur(0.3px) contrast(1.1) brightness(1.06) saturate(1.15)`;
    el.style.webkitBackdropFilter = el.style.backdropFilter;

    return {
      id,
      destroy() {
        document.getElementById(id)?.remove();
      },
    };
  }

  /* ---------- 长虹玻璃（竖棱折射） ----------
     横向锯齿位移，模拟竖向棱条对背景的折射：背景在每个棱处
     左右偏移，棱边界处形成不连续的棱镜感。 */
  function fluted(el, opts) {
    opts = opts || {};
    const w = Math.max(2, Math.round(el.offsetWidth));
    const h = Math.max(2, Math.round(el.offsetHeight));
    const ridgeWidth = opts.ridgeWidth || 8;   // 棱条宽度（像素）
    const amplitude = opts.amplitude || 1;     // 单条位移幅度（像素）
    const displacement = opts.displacement || 1;

    const id = 'aq-fluted-' + Math.random().toString(36).slice(2, 9);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const data = img.data;

    const raw = new Float32Array(w * h * 2);
    let maxScale = 0;
    let idx = 0;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const phase = (x % ridgeWidth) / ridgeWidth; // 0..1
        const saw = phase * 2 - 1; // -1..1 锯齿
        const ox = saw * amplitude;
        raw[idx] = ox;
        raw[idx + 1] = 0;
        maxScale = Math.max(maxScale, Math.abs(ox));
        idx += 2;
      }
    }
    maxScale = Math.max(1, maxScale);

    idx = 0;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp((raw[idx] / maxScale + 0.5) * 255, 0, 255);
      data[i + 1] = clamp((raw[idx + 1] / maxScale + 0.5) * 255, 0, 255);
      data[i + 2] = 0;
      data[i + 3] = 255;
      idx += 2;
    }
    ctx.putImageData(img, 0, 0);
    const dataUrl = canvas.toDataURL();

    buildDisplacementFilter(id, w, h, dataUrl, (maxScale * displacement).toFixed(2));

    el.style.backdropFilter = `url(#${id}) blur(0.3px) saturate(1.2) brightness(1.05)`;
    el.style.webkitBackdropFilter = el.style.backdropFilter;

    return {
      id,
      destroy() {
        document.getElementById(id)?.remove();
      },
    };
  }

  /* ---------- 液态金属（流动感） ----------
     用横向拉伸的分形噪声作为位移场，扭曲环境映射层。
     位移以垂直为主，模拟金属液面起伏；配合 CSS 的背景流动动画，
     环境映射穿过位移场时呈现液态金属的流动镜面。 */
  function liquidMetal(el, opts) {
    opts = opts || {};
    const w = Math.max(2, Math.round(el.offsetWidth));
    const h = Math.max(2, Math.round(el.offsetHeight));
    const scale = opts.scale || 16;          // 位移像素幅度
    const ridgeScale = opts.ridgeScale || 24; // 横向条纹周期
    const id = 'aq-metal-' + Math.random().toString(36).slice(2, 9);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const data = img.data;

    const noise = valueNoise2D(opts.seed || 7);
    const raw = new Float32Array(w * h * 2);
    let maxScale = 0;
    let idx = 0;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const nx = x / ridgeScale;   // 横向低频（条纹横向拉伸）
        const ny = y / 6;            // 纵向周期
        let v = 0;
        let amp = 0.55;
        let freq = 1;
        for (let o = 0; o < 4; o += 1) {
          v += amp * noise(nx * freq, ny * freq);
          amp *= 0.5;
          freq *= 2.1;
        }
        v = v * 2 - 1; // -1..1
        // 金属液面：以垂直位移为主，带轻微水平漂移
        raw[idx] = v * 0.25;
        raw[idx + 1] = v;
        maxScale = Math.max(maxScale, Math.abs(raw[idx]), Math.abs(raw[idx + 1]));
        idx += 2;
      }
    }
    maxScale = Math.max(1, maxScale);

    idx = 0;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp((raw[idx] / maxScale + 0.5) * 255, 0, 255);
      data[i + 1] = clamp((raw[idx + 1] / maxScale + 0.5) * 255, 0, 255);
      data[i + 2] = 0;
      data[i + 3] = 255;
      idx += 2;
    }
    ctx.putImageData(img, 0, 0);
    const dataUrl = canvas.toDataURL();

    buildDisplacementFilter(id, w, h, dataUrl, String(scale));

    // 扭曲流动层本身（不是 backdrop）
    el.style.filter = `url(#${id})`;
    el.style.webkitFilter = el.style.filter;

    return {
      id,
      destroy() {
        document.getElementById(id)?.remove();
      },
    };
  }

  /* ---------- 镜头色散滤镜（真 RGB 通道分离） ----------
     把 R 通道左移、B 通道右移，G 不动，screen 混合还原。
     冲击帧上短暂挂载，产生 1.2px 红青分离。 */
  let chromaticId = null;
  function ensureChromaticFilter() {
    if (chromaticId) return chromaticId;
    chromaticId = 'aq-chromatic';
    const d = 1.2;
    const N = (tag, attrs) => {
      const n = document.createElementNS(SVGNS, tag);
      Object.keys(attrs).forEach((k) => n.setAttribute(k, String(attrs[k])));
      return n;
    };
    const svg = N('svg', { width: '0', height: '0' });
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    const filter = N('filter', { id: chromaticId, 'color-interpolation-filters': 'sRGB' });

    filter.appendChild(N('feColorMatrix', {
      in: 'SourceGraphic', type: 'matrix',
      values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'red',
    }));
    filter.appendChild(N('feOffset', { in: 'red', dx: -d, dy: 0, result: 'redOff' }));
    filter.appendChild(N('feColorMatrix', {
      in: 'SourceGraphic', type: 'matrix',
      values: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'green',
    }));
    filter.appendChild(N('feColorMatrix', {
      in: 'SourceGraphic', type: 'matrix',
      values: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', result: 'blue',
    }));
    filter.appendChild(N('feOffset', { in: 'blue', dx: d, dy: 0, result: 'blueOff' }));
    filter.appendChild(N('feBlend', { in: 'redOff', in2: 'green', mode: 'screen', result: 'rg' }));
    filter.appendChild(N('feBlend', { in: 'rg', in2: 'blueOff', mode: 'screen' }));

    svg.appendChild(filter);
    document.body.appendChild(svg);
    return chromaticId;
  }

  /* ---------- 高饱和冲击帧（完整三段序列） ----------
     阶段1 压缩蓄力：scale 1→0.955，饱和 1→2.4，亮度微升
     阶段2 过冲爆发：scale 0.955→1.02，峰值饱和 + 真色散 + flash
     阶段3 回稳：scale 1.02→1，饱和回落到 1，色散瞬间消失 */
  function impact(el, opts) {
    opts = opts || {};
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // 减少动效：颜色直接到位，不做色散和位移
      el.animate(
        [{ filter: 'saturate(2)' }, { filter: 'saturate(1)' }],
        { duration: 140, easing: 'ease-out' },
      );
      return;
    }

    const split = opts.split !== false;
    const compress = opts.compress ?? 42;
    const burst = opts.burst ?? 64;
    const settle = opts.settle ?? 150;

    // 阶段1：压缩 + 饱和冲高（filter 只含可插值的 saturate/brightness）
    const a1 = el.animate(
      [
        { transform: 'scale(1)', filter: 'saturate(1) brightness(1)' },
        { transform: 'scale(0.955)', filter: 'saturate(2.4) brightness(1.18)' },
      ],
      { duration: compress, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'forwards' },
    );

    a1.onfinish = () => {
      // 阶段2：过冲 + 色散（色散稳定存在，transform 动画）
      a1.cancel();
      el.style.transform = 'scale(0.955)';
      if (opts.flash) flash();
      const chromatic = split ? ` url(#${ensureChromaticFilter()})` : '';
      el.style.filter = `saturate(2.6) brightness(1.22)${chromatic}`;
      const a2 = el.animate(
        [
          { transform: 'scale(0.955)' },
          { transform: 'scale(1.02)' },
        ],
        { duration: burst, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.3)', fill: 'forwards' },
      );
      a2.onfinish = () => {
        // 阶段3：回稳（移除色散，饱和亮度平滑回落）
        a2.cancel();
        el.style.transform = 'scale(1.02)';
        el.style.filter = '';
        const a3 = el.animate(
          [
            { transform: 'scale(1.02)', filter: 'saturate(2.3) brightness(1.1)' },
            { transform: 'scale(1)', filter: 'saturate(1) brightness(1)' },
          ],
          { duration: settle, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'forwards' },
        );
        a3.onfinish = () => {
          a3.cancel();
          el.style.transform = '';
          el.style.filter = '';
        };
      };
    };
  }

  /* 仅做一次镜头色散（不缩放、不冲击），用于色散演示 */
  function chromatic(el, opts) {
    opts = opts || {};
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = ensureChromaticFilter();
    const d = opts.duration ?? 220;
    el.style.filter = `url(#${id})`;
    setTimeout(() => {
      el.style.filter = '';
    }, d);
  }

  function flash() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const overlay = document.createElement('div');
    overlay.className = 'aq-flash';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 200);
  }

  /* ---------- 磨砂（未探明） ---------- */

  function frost(el, frozen) {
    if (!el) return;
    if (frozen === false) {
      el.classList.remove('aq-frosted');
      return;
    }
    el.classList.add('aq-frosted');
  }

  /* ---------- 指针跟随高光 ---------- */

  function specular(el) {
    if (!el) return;
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--aq-spec-x', `${x.toFixed(1)}%`);
      el.style.setProperty('--aq-spec-y', `${y.toFixed(1)}%`);
    });
  }

  /* ---------- 初始化：扫描带 data-* 的元素 ---------- */

  const lensInstances = [];
  let ro = null;

  function init(root) {
    const scope = root || document;

    // 超椭圆裁切
    scope.querySelectorAll('[data-superellipse]').forEach((el) => {
      const radius = parseFloat(el.dataset.superellipse) || 24;
      superellipse(el, radius, 5);
    });

    // 位移透镜（支持完整参数）
    scope.querySelectorAll('[data-lens]').forEach((el) => {
      const inst = lens(el, readLensOpts(el));
      lensInstances.push(inst);
      el.__aqLens = inst;
    });

    // 神迹晶体（球面折射）
    scope.querySelectorAll('[data-crystal]').forEach((el) => {
      const displacement = parseFloat(el.dataset.crystal) || 0.6;
      const inst = crystal(el, { displacement });
      lensInstances.push(inst);
    });

    // 长虹玻璃（竖棱折射）
    scope.querySelectorAll('[data-fluted]').forEach((el) => {
      const displacement = parseFloat(el.dataset.fluted) || 1;
      lensInstances.push(fluted(el, { displacement }));
    });

    // 液态金属（流动镜面）
    scope.querySelectorAll('[data-liquid-metal]').forEach((el) => {
      const scale = parseFloat(el.dataset.liquidMetal) || 16;
      lensInstances.push(liquidMetal(el, { scale }));
    });

    // 指针高光
    scope.querySelectorAll('[data-specular]').forEach(specular);

    // resize 时重算超椭圆
    if (!ro) {
      ro = new ResizeObserver(() => {
        scope.querySelectorAll('[data-superellipse]').forEach((el) => {
          const radius = parseFloat(el.dataset.superellipse) || 24;
          superellipse(el, radius, 5);
        });
      });
    }
    scope.querySelectorAll('[data-superellipse]').forEach((el) => ro.observe(el));
  }

  /* 从 data-* 属性读取透镜参数 */
  function readLensOpts(el) {
    const ds = el.dataset;
    return {
      radius: parseFloat(ds.lensRadius) || 24,
      roundness: parseFloat(ds.lensRoundness) || 5,
      displacement: parseFloat(ds.lens) || 1,
      thickness: ds.lensThickness != null ? parseFloat(ds.lensThickness) : 0.85,
      bulge: parseFloat(ds.lensBulge) || 0,
      dispersion: parseFloat(ds.lensDispersion) || 0,
    };
  }

  global.AoqiMaterial = {
    init,
    superellipse,
    lens,
    crystal,
    fluted,
    liquidMetal,
    impact,
    chromatic,
    flash,
    frost,
    specular,
    readLensOpts,
    get lensInstances() {
      return lensInstances;
    },
  };
})(window);
