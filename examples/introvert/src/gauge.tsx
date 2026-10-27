import React from 'react';
import {C, mix} from './lib';
import {SANS} from './fx';

/** i–e 指针表：半圆刻度，左 i（冷青）右 e（暖橙）。v ∈ [-1, 1]，-1 = 很内向，1 = 很外向。
 *  trail：过去的指针位置（残影），用来表现“一天里来回摆”。 */
export const Gauge: React.FC<{x: number; y: number; r: number; v: number; o?: number; trail?: number[];
  glow?: number; labels?: boolean}> = ({x, y, r, v, o = 1, trail = [], glow = 0, labels = true}) => {
  if (o <= 0) return null;
  const ang = (val: number) => Math.PI * (1 - (val + 1) / 2); // -1 → 180°（左），1 → 0°（右）
  const pt = (val: number, rr: number) => [x + Math.cos(ang(val)) * rr, y - Math.sin(ang(val)) * rr];
  const ticks = Array.from({length: 21}, (_, k) => -1 + k * 0.1);
  const needle = pt(v, r * 0.86);
  const col = (val: number) => {
    const k = (val + 1) / 2;
    const a = [0x4f, 0xe3, 0xd0], b = [0xff, 0x9a, 0x47];
    return `rgb(${a.map((c, i) => Math.round(mix(c, b[i], k))).join(',')})`;
  };
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id={`arc${x}${y}`} x1={x - r} x2={x + r} y1={0} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.i} />
          <stop offset={1} stopColor={C.e} />
        </linearGradient>
      </defs>
      <path d={`M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y}`} fill="none" stroke={`url(#arc${x}${y})`}
        strokeWidth={r * 0.06} strokeLinecap="round" opacity={0.85} filter="url(#glowSoft)" />
      {ticks.map((tv, k) => {
        const [x1, y1] = pt(tv, r * 0.9);
        const [x2, y2] = pt(tv, r * (k % 5 === 0 ? 0.76 : 0.83));
        return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.dim} strokeWidth={k % 5 === 0 ? 2 : 1} opacity={0.6} />;
      })}
      {trail.map((tv, k) => {
        const [tx, ty] = pt(tv, r * 0.86);
        return <line key={k} x1={x} y1={y} x2={tx} y2={ty} stroke={col(tv)} strokeWidth={r * 0.02}
          opacity={0.08 + 0.25 * (k / Math.max(1, trail.length))} strokeLinecap="round" />;
      })}
      <line x1={x} y1={y} x2={needle[0]} y2={needle[1]} stroke={col(v)} strokeWidth={r * 0.045} strokeLinecap="round"
        filter={glow > 0.3 ? 'url(#glowBig)' : 'url(#glow)'} />
      <circle cx={x} cy={y} r={r * 0.07} fill={C.ink} />
      {glow > 0 && <circle cx={x} cy={y} r={r * (1.15 + glow * 0.2)} fill="none" stroke={C.amber} strokeWidth={2}
        opacity={glow * 0.8} filter="url(#glowBig)" />}
      {labels && (
        <>
          <text x={x - r - r * 0.16} y={y + r * 0.08} fill={C.i} fontFamily={SANS} fontWeight={900}
            fontSize={r * 0.28} textAnchor="end">i</text>
          <text x={x + r + r * 0.16} y={y + r * 0.08} fill={C.e} fontFamily={SANS} fontWeight={900}
            fontSize={r * 0.28} textAnchor="start">e</text>
        </>
      )}
    </g>
  );
};

/** 一天里的指针轨迹：早上 i → 上班中间 → 饭局 e → 回家 i，带小抖动 */
export const dayNeedle = (u: number) => {
  const keys: [number, number][] = [[0, -0.8], [0.2, -0.6], [0.35, 0.1], [0.5, -0.2], [0.68, 0.9], [0.8, 0.6], [1, -0.85]];
  let k = 0;
  while (k < keys.length - 2 && u > keys[k + 1][0]) k++;
  const [u0, v0] = keys[k], [u1, v1] = keys[k + 1];
  const f = Math.min(1, Math.max(0, (u - u0) / (u1 - u0)));
  const s = f * f * (3 - 2 * f);
  return v0 + (v1 - v0) * s + 0.06 * Math.sin(u * 60);
};
