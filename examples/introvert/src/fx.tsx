import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {C, H, W, rand} from './lib';

export const SANS = 'IESans, "Noto Sans SC", sans-serif';
export const SERIF = 'IESerif, "Noto Serif SC", serif';

export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const faces = [
      new FontFace('IESans', `url(${staticFile('fonts/NotoSansSC.ttf')})`, {weight: '100 900'}),
      new FontFace('IESerif', `url(${staticFile('fonts/NotoSerifSC.ttf')})`, {weight: '200 900'}),
    ];
    Promise.all(faces.map((f) => f.load().then((ff) => (document.fonts as unknown as Set<FontFace>).add(ff))))
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
  return null;
};

/** 背景：深色底 + 缓慢流动的两团色光（冷青、暖橙），让画面不死黑 */
export const Background: React.FC<{tint?: number}> = ({tint = 0.5}) => {
  const f = useCurrentFrame();
  const a = 30 + 10 * Math.sin(f / 140);
  const b = 70 + 10 * Math.cos(f / 170);
  return (
    <div style={{position: 'absolute', inset: 0, background: `
      radial-gradient(circle at ${a}% 30%, ${C.i}${Math.round(18 * (1 - tint)).toString(16).padStart(2, '0')} 0%, transparent 45%),
      radial-gradient(circle at ${b}% 75%, ${C.e}${Math.round(18 * tint).toString(16).padStart(2, '0')} 0%, transparent 45%),
      radial-gradient(ellipse 90% 80% at 50% 45%, #10131c 0%, ${C.bg} 75%)`}} />
  );
};

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: 0.06, mixBlendMode: 'overlay',
        backgroundImage: `url(${staticFile('grain.png')})`, backgroundSize: '512px 512px',
        backgroundPosition: `${Math.floor(rand(f, 9) * 512)}px ${Math.floor(rand(f, 10) * 512)}px`}} />
      <div style={{position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.5) 100%)'}} />
    </>
  );
};

export const GlowDefs: React.FC = () => (
  <defs>
    {([['glow', 3, 9], ['glowBig', 6, 20], ['glowSoft', 2, 5]] as const).map(([id, a, b]) => (
      // 用固定的大区域：objectBoundingBox 在纯竖线 / 横线上宽或高为 0，会让带滤镜的线整条消失
      <filter key={id} id={id} filterUnits="userSpaceOnUse" x={-3000} y={-3000} width={7000} height={7000}>
        <feGaussianBlur in="SourceGraphic" stdDeviation={a} result="b1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation={b} result="b2" />
        <feMerge>
          <feMergeNode in="b2" />
          <feMergeNode in="b1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    ))}
  </defs>
);

/** 全屏 SVG 舞台，可整体缩放 / 平移（推拉镜头） */
export const Stage: React.FC<{children: React.ReactNode; o?: number; zoom?: number; cx?: number; cy?: number;
  dx?: number; dy?: number}> = ({children, o = 1, zoom = 1, cx = W / 2, cy = H / 2, dx = 0, dy = 0}) =>
  o <= 0 ? null : (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, opacity: o}}>
      <GlowDefs />
      <g transform={`translate(${dx} ${dy}) translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>{children}</g>
    </svg>
  );

/** 简笔小人：圆头 + 圆角身体 */
export const Person: React.FC<{x: number; y: number; s?: number; color?: string; o?: number}> =
  ({x, y, s = 1, color = C.ink, o = 1}) =>
    o <= 0 ? null : (
      <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
        <circle cx={0} cy={-38} r={13} fill={color} />
        <path d="M -20 0 Q -20 -22 0 -22 Q 20 -22 20 0 Z" fill={color} />
      </g>
    );

/** 白色闪光（重击时） */
export const Flash: React.FC<{k: number; color?: string}> = ({k, color = '#ffffff'}) =>
  k <= 0 ? null : <div style={{position: 'absolute', inset: 0, background: color, opacity: k * 0.35}} />;
