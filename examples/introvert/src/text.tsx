import React from 'react';
import {C, ramp} from './lib';
import {SANS} from './fx';
import {SUBS, subEnd} from './subs';

/** [琥珀] {冷青 i} <暖橙 e> */
export const rich = (s: string) =>
  s.split(/(\[[^\]]+\]|\{[^}]+\}|<[^>]+>)/).filter(Boolean).map((seg, k) => {
    const color = seg[0] === '[' ? C.amber : seg[0] === '{' ? C.i : seg[0] === '<' ? C.e : null;
    return color
      ? <span key={k} style={{color, textShadow: `0 0 16px ${color}66`}}>{seg.slice(1, -1)}</span>
      : <span key={k}>{seg}</span>;
  });

export const Subtitle: React.FC<{t: number}> = ({t}) => {
  const i = SUBS.findIndex(([s], k) => t >= s - 0.02 && t < subEnd(k) + 0.2);
  if (i < 0) return null;
  const [s, text] = SUBS[i];
  const e = subEnd(i);
  const a = s === 0 ? 1 : ramp(t, s - 0.02, s + 0.22, 'out');   // 第 0 帧就满显示
  const o = Math.min(a, 1 - ramp(t, e - 0.02, e + 0.2));
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 618, textAlign: 'center', fontFamily: SANS,
      fontWeight: 600, fontSize: 32, letterSpacing: '0.04em', color: C.ink, opacity: o,
      transform: `translateY(${(1 - a) * 10}px)`, textShadow: '0 2px 14px rgba(0,0,0,0.95), 0 0 2px #000'}}>
      {rich(text)}
    </div>
  );
};

/** 大字：带回弹入场 */
export const Big: React.FC<{t: number; t0: number; t1: number; children: React.ReactNode; x?: number; y: number;
  size: number; color?: string; weight?: number; rotate?: number; glow?: string; spacing?: string; slam?: boolean}> =
  ({t, t0, t1, children, x = 640, y, size, color = C.ink, weight = 900, rotate = 0, glow, spacing = '0.02em', slam}) => {
    const a = ramp(t, t0, t0 + (slam ? 0.18 : 0.35), slam ? 'out' : 'back');
    const o = Math.min(ramp(t, t0, t0 + 0.12), 1 - ramp(t, t1 - 0.25, t1));
    if (o <= 0) return null;
    const sc = slam ? 1.6 - 0.6 * a : 0.6 + 0.4 * a;
    return (
      <div style={{position: 'absolute', left: x - 600, width: 1200, top: y, textAlign: 'center', fontFamily: SANS,
        fontWeight: weight, fontSize: size, color, opacity: o, letterSpacing: spacing, lineHeight: 1,
        transform: `scale(${sc}) rotate(${rotate}deg)`, textShadow: glow ? `0 0 24px ${glow}, 0 0 60px ${glow}66` : undefined}}>
        {children}
      </div>
    );
  };

/** 小标注 */
export const Label: React.FC<{x: number; y: number; o: number; children: React.ReactNode; color?: string;
  size?: number; align?: 'left' | 'center' | 'right'; weight?: number}> =
  ({x, y, o, children, color = C.dim, size = 20, align = 'center', weight = 500}) =>
    o <= 0 ? null : (
      <div style={{position: 'absolute', left: align === 'left' ? x : align === 'center' ? x - 400 : x - 800,
        width: 800, top: y, textAlign: align, fontFamily: SANS, fontSize: size, fontWeight: weight,
        letterSpacing: '0.06em', color, opacity: o, whiteSpace: 'nowrap'}}>
        {children}
      </div>
    );
