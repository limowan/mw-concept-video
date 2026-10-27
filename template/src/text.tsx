import React from 'react';
import {C, ramp} from './lib';
import {SANS} from './fx';
import {SUBS, subEnd} from './subs';

/** 字幕里的高亮：[主色] {概念色} <红色>；每句至多 1–2 处 */
export const rich = (s: string) =>
  s.split(/(\[[^\]]+\]|\{[^}]+\}|<[^>]+>)/).filter(Boolean).map((seg, k) => {
    const color = seg[0] === '[' ? C.hero : seg[0] === '{' ? C.idea : seg[0] === '<' ? C.red : null;
    return color
      ? <span key={k} style={{color, textShadow: `0 0 16px ${color}66`}}>{seg.slice(1, -1)}</span>
      : <span key={k}>{seg}</span>;
  });

/** 底部字幕：第 0 句第 0 帧就满显示，其余淡入；画面内容不要压到 y > 600 */
export const Subtitle: React.FC<{t: number}> = ({t}) => {
  const i = SUBS.findIndex(([s], k) => t >= s - 0.02 && t < subEnd(k) + 0.2);
  if (i < 0) return null;
  const [s, text] = SUBS[i];
  const e = subEnd(i);
  const a = s === 0 ? 1 : ramp(t, s - 0.02, s + 0.22, 'out');
  const o = Math.min(a, 1 - ramp(t, e - 0.02, e + 0.2));
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 622, textAlign: 'center', fontFamily: SANS,
      fontWeight: 600, fontSize: 32, letterSpacing: '0.04em', color: C.ink, opacity: o,
      transform: `translateY(${(1 - a) * 10}px)`, textShadow: '0 2px 14px rgba(0,0,0,0.95), 0 0 2px #000'}}>
      {rich(text)}
    </div>
  );
};

/** 大字：slam = 由大到小砸下来（数字、关键词）；否则回弹入场 */
export const Big: React.FC<{t: number; t0: number; t1: number; children: React.ReactNode; x?: number; y: number;
  size: number; color?: string; weight?: number; font?: string; glow?: string; spacing?: string; slam?: boolean}> =
  ({t, t0, t1, children, x = 640, y, size, color = C.ink, weight = 900, font = SANS, glow, spacing = '0.02em', slam}) => {
    const a = ramp(t, t0, t0 + (slam ? 0.2 : 0.4), slam ? 'out' : 'back');
    const o = Math.min(ramp(t, t0, t0 + 0.1), 1 - ramp(t, t1 - 0.3, t1));
    if (o <= 0) return null;
    const sc = slam ? 1.7 - 0.7 * a : 0.7 + 0.3 * a;
    return (
      <div style={{position: 'absolute', left: x - 600, width: 1200, top: y, textAlign: 'center', fontFamily: font,
        fontWeight: weight, fontSize: size, color, opacity: o, letterSpacing: spacing, lineHeight: 1,
        transform: `scale(${sc})`, textShadow: glow ? `0 0 24px ${glow}, 0 0 70px ${glow}66` : undefined}}>
        {children}
      </div>
    );
  };

/** 小标注：不小于 18 像素，不压曲线和别的字 */
export const Label: React.FC<{x: number; y: number; o: number; children: React.ReactNode; color?: string;
  size?: number; weight?: number; font?: string; spacing?: string}> =
  ({x, y, o, children, color = C.dim, size = 20, weight = 500, font = SANS, spacing = '0.08em'}) =>
    o <= 0 ? null : (
      <div style={{position: 'absolute', left: x - 400, width: 800, top: y, textAlign: 'center', fontFamily: font,
        fontSize: size, fontWeight: weight, letterSpacing: spacing, color, opacity: o, whiteSpace: 'nowrap'}}>
        {children}
      </div>
    );
