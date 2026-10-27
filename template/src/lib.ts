import {Easing} from 'remotion';

export const W = 1280;
export const H = 720;
export const FPS = 30;
/** 全片秒数：改文稿时同步改 */
export const LENGTH_S = 16;
export const TOTAL_FRAMES = LENGTH_S * FPS;

/** 颜色即叙事：每支片子定 2–3 个有含义的颜色，全片不乱用。下面是示例，换题时重定 */
export const C = {
  bg: '#08090c',
  ink: '#F2F1EC',
  dim: '#8C8F99',
  line: '#3A3D46',
  hero: '#F2C462',   // 主角 / 结论
  idea: '#7FD8F2',   // 概念 / 道理
  red: '#FF5D6C',    // 出错 / 反转
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const back = Easing.bezier(0.34, 1.56, 0.64, 1);

/** t 在 [a,b] 内从 0 走到 1；'back' 带回弹 */
export const ramp = (t: number, a: number, b: number, kind: 'io' | 'out' | 'lin' | 'back' = 'io') => {
  const x = clamp((t - a) / (b - a));
  return kind === 'lin' ? x : kind === 'out' ? easeOut(x) : kind === 'back' ? back(x) : ease(x);
};

/** 场景显隐：a 秒淡入，b 秒淡出 */
export const win = (t: number, a: number, b: number, fi = 0.25, fo = 0.25) =>
  Math.min(ramp(t, a, a + fi, 'out'), 1 - ramp(t, b - fo, b));

export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/** 稳定的伪随机，0–1（同样的输入每帧结果一样，渲染不会闪） */
export const rand = (i: number, salt = 0) => {
  const x = Math.sin(i * 91.7 + salt * 271.3 + 13.1) * 43758.5453;
  return x - Math.floor(x);
};

/** t0 处为 1，dur 秒内衰减到 0：闪光、冲击 */
export const pulse = (t: number, t0: number, dur = 0.4) => (t < t0 || t > t0 + dur ? 0 : 1 - (t - t0) / dur);

/** 画面抖动偏移：重击时用 */
export const shake = (t: number, t0: number, amp = 8, dur = 0.35) => {
  const k = pulse(t, t0, dur);
  return [Math.sin(t * 83) * amp * k, Math.cos(t * 71) * amp * k] as const;
};
