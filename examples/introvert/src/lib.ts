import {Easing} from 'remotion';

export const W = 1280;
export const H = 720;
export const FPS = 30;
export const LENGTH_S = 141;
export const TOTAL_FRAMES = LENGTH_S * FPS;

export const C = {
  bg: '#07080d',
  ink: '#F2F4F8',
  dim: '#8C93A3',
  line: '#3A4152',
  i: '#4FE3D0',      // i 人：冷青
  e: '#FF9A47',      // e 人：暖橙
  flip: '#FF4FA3',   // 变化 / 翻车 / 噪声：品红
  amber: '#F7C96B',  // 结论
  red: '#FF5A5A',
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const back = Easing.bezier(0.34, 1.56, 0.64, 1);

/** t 在 [a,b] 内从 0 到 1；'back' 带回弹 */
export const ramp = (t: number, a: number, b: number, kind: 'io' | 'out' | 'lin' | 'back' = 'io') => {
  const x = clamp((t - a) / (b - a));
  return kind === 'lin' ? x : kind === 'out' ? easeOut(x) : kind === 'back' ? back(x) : ease(x);
};

/** 场景窗口透明度 */
export const win = (t: number, a: number, b: number, fi = 0.25, fo = 0.25) =>
  Math.min(ramp(t, a, a + fi, 'out'), 1 - ramp(t, b - fo, b));

export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

export const rand = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 快速冲击：t0 处为 1，dur 秒内衰减到 0（用于闪光、抖动） */
export const pulse = (t: number, t0: number, dur = 0.4) => (t < t0 || t > t0 + dur ? 0 : 1 - (t - t0) / dur);

/** 画面抖动偏移 */
export const shake = (t: number, t0: number, amp = 8, dur = 0.35) => {
  const k = pulse(t, t0, dur);
  return [Math.sin(t * 90) * amp * k, Math.cos(t * 77) * amp * k] as const;
};
