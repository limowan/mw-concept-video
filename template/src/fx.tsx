import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {C, H, W, rand} from './lib';

export const SANS = 'CvSans, "Noto Sans SC", sans-serif';
export const SERIF = 'CvSerif, "Noto Serif SC", serif';

/** 加载 public/fonts 里的思源黑体 / 宋体；字体没下载时退回系统字体，不卡渲染 */
export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const faces = [
      new FontFace('CvSans', `url(${staticFile('fonts/NotoSansSC.ttf')})`, {weight: '100 900'}),
      new FontFace('CvSerif', `url(${staticFile('fonts/NotoSerifSC.ttf')})`, {weight: '200 900'}),
    ];
    Promise.allSettled(faces.map((f) => f.load().then((ff) => (document.fonts as unknown as Set<FontFace>).add(ff))))
      .then(() => continueRender(handle));
  }, [handle]);
  return null;
};

/** 背景：近黑底 + 一团跟着主角走的暖光（warm 0–1，cx / cy 用百分比） */
export const Background: React.FC<{warm?: number; cx?: number; cy?: number}> = ({warm = 0.5, cx = 50, cy = 45}) => {
  const f = useCurrentFrame();
  const a = Math.round(10 + 22 * warm).toString(16).padStart(2, '0');
  const drift = Math.sin(f / 160) * 3;
  return (
    <div style={{position: 'absolute', inset: 0, background: `
      radial-gradient(circle at ${cx + drift}% ${cy}%, ${C.hero}${a} 0%, transparent 38%),
      radial-gradient(ellipse 95% 85% at 50% 45%, #121318 0%, ${C.bg} 78%)`}} />
  );
};

/** 漂浮微尘 */
export const Dust: React.FC<{t: number; o?: number}> = ({t, o = 1}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: o}}>
    {Array.from({length: 46}, (_, k) => {
      const x = (rand(k, 1) * W + t * (6 + rand(k, 2) * 10)) % W;
      const y = (rand(k, 3) * H - t * (4 + rand(k, 4) * 8) + H * 4) % H;
      return <circle key={k} cx={x} cy={y} r={0.8 + rand(k, 5) * 1.6} fill={C.ink}
        opacity={0.08 + 0.18 * Math.abs(Math.sin(t * 0.7 + k))} />;
    })}
  </svg>
);

/** 胶片颗粒 + 暗角（public/grain.png 用 tools/make_grain.py 生成） */
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay',
        backgroundImage: `url(${staticFile('grain.png')})`, backgroundSize: '512px 512px',
        backgroundPosition: `${Math.floor(rand(f, 7) * 512)}px ${Math.floor(rand(f, 8) * 512)}px`}} />
      <div style={{position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 78% 78% at 50% 48%, transparent 58%, rgba(0,0,0,0.55) 100%)'}} />
    </>
  );
};

/**
 * 发光滤镜。必须用 userSpaceOnUse + 固定大区域：
 * 默认按包围盒算，纯横线 / 竖线的宽或高是 0，带滤镜的线会整条消失。
 */
export const GlowDefs: React.FC = () => (
  <defs>
    {([['glow', 3, 10], ['glowBig', 8, 26], ['glowSoft', 1.5, 5]] as const).map(([id, a, b]) => (
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

/** 全屏 SVG 舞台：zoom / 平移做推拉镜头 */
export const Stage: React.FC<{children: React.ReactNode; o?: number; zoom?: number; cx?: number; cy?: number;
  dx?: number; dy?: number}> = ({children, o = 1, zoom = 1, cx = W / 2, cy = H / 2, dx = 0, dy = 0}) =>
  o <= 0 ? null : (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, opacity: o}}>
      <GlowDefs />
      <g transform={`translate(${dx} ${dy}) translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>{children}</g>
    </svg>
  );

/** 闪光：重击时用 */
export const Flash: React.FC<{k: number; color?: string}> = ({k, color = '#ffffff'}) =>
  k <= 0 ? null : <div style={{position: 'absolute', inset: 0, background: color, opacity: k * 0.4}} />;
