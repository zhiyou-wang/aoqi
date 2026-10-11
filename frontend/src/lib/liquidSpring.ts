/**
 * 液态交互的弹簧物理原语（零第三方依赖）。
 *
 * 半隐式欧拉（semi-implicit Euler）积分，参数 1:1 对齐官方
 * kyant/backdrop LiquidButton：stiffness = 300、dampingRatio = 0.5
 * （damping = 0.5 · 2√k ≈ 17.32）。
 *
 * 按钮（按压 + 拖拽三轴）与玻璃卡片（单轴按压）共用这一套原语，
 * 保证全站液态控件回弹 / 形变手感完全一致。
 */

export const LIQUID_STIFFNESS = 300;
export const LIQUID_DAMPING = 0.5 * 2 * Math.sqrt(LIQUID_STIFFNESS); // ≈ 17.32

export interface SpringOptions {
  stiffness?: number;
  damping?: number;
  /** 判定停振的位置容差（|value - target|） */
  posEps?: number;
  /** 判定停振的速度容差（|velocity|） */
  velEps?: number;
}

/** 单轴弹簧：位置 / 速度 / 目标，半隐式欧拉推进 */
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  private readonly k: number;
  private readonly c: number;
  private readonly posEps: number;
  private readonly velEps: number;

  constructor(initial = 0, opts: SpringOptions = {}) {
    this.value = initial;
    this.target = initial;
    this.k = opts.stiffness ?? LIQUID_STIFFNESS;
    this.c = opts.damping ?? LIQUID_DAMPING;
    this.posEps = opts.posEps ?? 0.002;
    this.velEps = opts.velEps ?? 0.02;
  }

  /** 推进一帧（dt 单位：秒） */
  step(dt: number): void {
    this.velocity += (-this.k * (this.value - this.target) - this.c * this.velocity) * dt;
    this.value += this.velocity * dt;
  }

  get settled(): boolean {
    return (
      Math.abs(this.value - this.target) < this.posEps &&
      Math.abs(this.velocity) < this.velEps
    );
  }

  /** 直接吸附到目标并清零速度（停振时写精确终态） */
  snapToTarget(): void {
    this.value = this.target;
    this.velocity = 0;
  }

  setTarget(t: number): void {
    this.target = t;
  }

  /** 重置到给定值（同时作为目标），清零速度 */
  reset(v = 0): void {
    this.value = v;
    this.target = v;
    this.velocity = 0;
  }
}

/**
 * rAF 驱动的一组弹簧：每帧推进全部弹簧并回调 onFrame 写样式；
 * 所有轴都停振后，先吸附到各自目标、再回调一次写精确终态，然后停振。
 *
 * 帧间隔钳制与原组件保持一致：真实 dt，超过 1/30s（切后台等）按 1/60s 处理。
 */
export class SpringRunner {
  private raf = 0;
  private running = false;
  private lastT = 0;

  constructor(
    private readonly springs: Spring[],
    private readonly onFrame: () => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastT = 0;
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.running = false;
    this.lastT = 0;
  }

  private frame(now: number): void {
    let dt = this.lastT ? (now - this.lastT) / 1000 : 1 / 60;
    this.lastT = now;
    if (dt <= 0 || dt > 1 / 30) dt = 1 / 60;

    for (const s of this.springs) s.step(dt);

    if (this.springs.every((s) => s.settled)) {
      for (const s of this.springs) s.snapToTarget();
      this.onFrame();
      this.stop();
      return;
    }
    this.onFrame();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }
}
