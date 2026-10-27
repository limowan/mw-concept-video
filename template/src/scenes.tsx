import React from 'react';
import {C, mix, pulse, rand, ramp, shake, win} from './lib';
import {Flash, SERIF, Stage} from './fx';
import {Big} from './text';

/*
 * 演示开场（0–16 秒），展示几条硬规则怎么落到代码上：
 * - 第 0 帧就有主角（发光的球）+ 问题字幕 + 声音
 * - 1.5 秒一次大变化（球一分为三）
 * - 一句一变：4 秒逐个入场计数，8 秒数字砸出，12 秒标题重击
 * - 每个场景内部一直有小律动，不停超过 2 秒
 * 换成自己的题目时，删掉这个文件，按视频文稿重写场景。
 */

const orb = (x: number, y: number, r: number, color: string, o = 1, k = 0) => (
  <g key={k} opacity={o}>
    <circle cx={x} cy={y} r={r * 1.6} fill={color} opacity={0.18} filter="url(#glowBig)" />
    <circle cx={x} cy={y} r={r} fill={color} filter="url(#glow)" />
  </g>
);

export const Opening: React.FC<{t: number}> = ({t}) => {
  if (t > 12.3) return null;
  const split = ramp(t, 1.5, 2.1, 'back');
  const pull = ramp(t, 8, 9.2);
  const [sx, sy] = shake(t, 8, 10);
  const breathe = 1 + 0.06 * Math.sin(t * 3);
  const count = Math.min(12, Math.floor(ramp(t, 4, 7.2, 'lin') * 12 + 0.001));
  return (
    <>
      <Stage zoom={1 + 0.04 * ramp(t, 0, 1.5, 'lin') + 0.06 * pulse(t, 1.5, 0.6) - 0.15 * pull} dx={sx} dy={sy}
        o={1 - ramp(t, 11.8, 12.2)}>
        {/* 主角：0–1.5 秒一个球，1.5 秒一分为三 */}
        {[-1, 0, 1].map((d, k) =>
          orb(640 + d * 230 * split, 300 - Math.abs(d) * 40 * split, (d === 0 ? 70 : 46 * split) * breathe,
            d === 0 ? C.hero : C.idea, d === 0 ? 1 : split, k))}
        {/* 绕着转的光点 */}
        {Array.from({length: 18}, (_, k) => {
          const a = k / 18 * Math.PI * 2 + t * 0.8;
          const r = 130 + 20 * Math.sin(t * 2 + k);
          return <circle key={`p${k}`} cx={640 + Math.cos(a) * r * (1 + split)} cy={300 + Math.sin(a) * r * 0.5}
            r={2 + rand(k, 1) * 2} fill={C.ink} opacity={0.5} filter="url(#glowSoft)" />;
        })}
        {/* 4–8 秒：逐个入场 */}
        {Array.from({length: count}, (_, k) => {
          const a = ramp(t, 4 + k * 0.27, 4.25 + k * 0.27, 'back');
          return <circle key={`c${k}`} cx={250 + k * 71} cy={500} r={14 * a} fill={k < 8 ? C.hero : C.red}
            opacity={0.9} filter="url(#glowSoft)" />;
        })}
      </Stage>
      <Big t={t} t0={4} t1={7.9} y={60} size={64} color={C.ink}>{count} / 12</Big>
      <Big t={t} t0={8} t1={11.9} y={170} size={180} color={C.red} glow={C.red} slam>≈ 70%</Big>
      <Flash k={pulse(t, 8, 0.25) * 0.5} color={C.red} />
    </>
  );
};

export const Title: React.FC<{t: number}> = ({t}) => {
  if (t < 11.95) return null;
  const o = Math.min(ramp(t, 12, 12.08), 1 - ramp(t, 15.4, 15.9));
  const a = ramp(t, 12, 12.25, 'out');
  return (
    <>
      <Flash k={pulse(t, 12, 0.35)} color={C.hero} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', opacity: o,
        transform: `scale(${1.3 - 0.3 * a + 0.03 * ramp(t, 13, 16, 'lin')})`, fontFamily: SERIF, fontWeight: 700,
        fontSize: 124, letterSpacing: '0.18em', paddingLeft: '0.18em', color: C.ink,
        textShadow: `0 0 26px ${C.hero}66`}}>标题</div>
      <Stage o={o}>
        {orb(640, mix(430, 450, ramp(t, 12, 13)), 26 + 4 * Math.sin(t * 3), C.hero)}
        {Array.from({length: 24}, (_, k) => {
          const u = t - 12.4 - rand(k, 61) * 2.5;
          if (u < 0) return null;
          return <circle key={k} cx={640 + (rand(k, 62) - 0.5) * 220 + Math.sin(u * 2 + k) * 14} cy={460 - u * 70}
            r={1.5 + rand(k, 63) * 2} fill={C.hero} opacity={Math.max(0, 0.85 - u * 0.3) * win(t, 12, 16)}
            filter="url(#glowSoft)" />;
        })}
      </Stage>
    </>
  );
};
