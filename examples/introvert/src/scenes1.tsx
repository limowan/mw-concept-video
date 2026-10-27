import React from 'react';
import {C, mix, pulse, rand, ramp, shake, win} from './lib';
import {Flash, Person, SANS, Stage} from './fx';
import {Big, Label} from './text';
import {Gauge, dayNeedle} from './gauge';

/* ================= 0–16 秒：柠檬汁实验 → 翻车 → 只在上午灵 ================= */
const LEMON = '#FFE45C';
const PX0 = 360, PX1 = 920, PY0 = 520, PY1 = 170;
const dots = Array.from({length: 100}, (_, i) => {
  const intro = rand(i, 1);
  const saliva = Math.min(1, Math.max(0, intro * 0.8 + (rand(i, 2) - 0.5) * 0.45 + 0.1));
  return {intro, saliva, cloud: rand(i, 3)};
});

const Drop: React.FC<{x: number; y: number; s: number; o?: number}> = ({x, y, s, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} filter="url(#glowBig)">
    <path d="M 0 -60 C 18 -30 40 -5 40 18 A 40 40 0 0 1 -40 18 C -40 -5 -18 -30 0 -60 Z" fill={LEMON} />
    <ellipse cx={-12} cy={8} rx={9} ry={14} fill="#fff" opacity={0.7} />
  </g>
);

export const Lemon: React.FC<{t: number}> = ({t}) => {
  if (t > 16.2) return null;
  const fall = ramp(t, 1.45, 1.75, 'lin');
  const splash = t >= 1.75 ? t - 1.75 : -1;
  const zoom = mix(1.35, 1, ramp(t, 3.6, 4.6));
  const toPlot = ramp(t, 4.1, 5.0);
  const lineDraw = ramp(t, 5.2, 6.2);
  const snap = ramp(t, 8.0, 8.9, 'out');
  const scatter = ramp(t, 8.0, 8.5, 'out');
  const [sx, sy] = shake(t, 8.0, 10);
  const plotO = 1 - ramp(t, 11.6, 12.1);
  const collapse = ramp(t, 15.3, 16.0, 'io');
  const sunU = ramp(t, 12.2, 14.8, 'io');
  const noon = sunU > 0.5;
  return (
    <>
      <Stage zoom={zoom * (1 - collapse * 0.9)} dx={sx} dy={sy} o={1 - ramp(t, 15.8, 16.1)}>
        {/* 舌面 */}
        <line x1={240} x2={1040} y1={520} y2={520} stroke={C.flip} strokeWidth={3} opacity={0.7 * (1 - toPlot)}
          filter="url(#glow)" />
        {t < 1.8 && <Drop x={640} y={mix(270, 470, fall * fall)} s={1.6 - 0.6 * fall + 0.05 * Math.sin(t * 6)} />}
        {splash >= 0 && splash < 2.4 && [0, 1, 2].map((k) => {
          const u = Math.max(0, splash - k * 0.18);
          return <ellipse key={k} cx={640} cy={520} rx={30 + u * 260} ry={(30 + u * 260) * 0.18} fill="none"
            stroke={LEMON} strokeWidth={3} opacity={Math.max(0, 1 - u / 1.6)} filter="url(#glowSoft)" />;
        })}
        {splash >= 0 && splash < 1.2 && Array.from({length: 26}, (_, k) => {
          const a = Math.PI * (0.1 + 0.8 * rand(k, 4));
          const sp = 150 + rand(k, 5) * 250;
          return <circle key={k} cx={640 + Math.cos(a) * sp * splash} cy={520 - Math.sin(a) * sp * splash + 300 * splash * splash}
            r={3 + rand(k, 6) * 3} fill={LEMON} opacity={1 - splash / 1.2} />;
        })}
        {/* 100 个点：从涟漪飞成散点图，8 秒翻车后乱成一团 */}
        {t > 3.9 && dots.map((d, i) => {
          const a = (i / 100) * Math.PI * 2;
          const rx = 640 + Math.cos(a) * 300, ry = 520 + Math.sin(a) * 50;
          const px = mix(PX0, PX1, d.intro), py = mix(PY0, PY1, d.saliva);
          const cy2 = mix(PY0, PY1, d.cloud);
          const x = mix(rx, px, toPlot), y = mix(mix(ry, py, toPlot), cy2, scatter);
          return <circle key={i} cx={x} cy={y} r={5} fill={i % 2 ? C.i : C.e} opacity={0.9 * plotO} />;
        })}
        {t > 4 && (
          <g opacity={ramp(t, 4.4, 4.9) * plotO}>
            <line x1={PX0} x2={PX1} y1={PY0 + 20} y2={PY0 + 20} stroke={C.line} strokeWidth={2} />
            <line x1={PX0 - 20} x2={PX0 - 20} y1={PY1} y2={PY0 + 20} stroke={C.line} strokeWidth={2} />
          </g>
        )}
        {/* 相关线：画出来，8 秒啪地断成两截掉下去 */}
        {t > 5.2 && (
          <g opacity={plotO} filter="url(#glow)">
            <line x1={PX0} y1={PY0 - 30} x2={mix(PX0, 640, Math.min(1, lineDraw * 2))}
              y2={mix(PY0 - 30, 345, Math.min(1, lineDraw * 2))} stroke={C.amber} strokeWidth={5}
              transform={`rotate(${snap * 35} ${PX0} ${PY0 - 30}) translate(0 ${snap * 70})`} strokeLinecap="round"
              opacity={1 - ramp(t, 8.4, 9.0)} />
            {lineDraw > 0.5 && (
              <line x1={640} y1={345} x2={mix(640, PX1, (lineDraw - 0.5) * 2)} y2={mix(345, PY1 + 10, (lineDraw - 0.5) * 2)}
                stroke={C.amber} strokeWidth={5} strokeLinecap="round"
                transform={`rotate(${-snap * 40} ${PX1} ${PY1 + 10}) translate(0 ${snap * 90})`}
                opacity={1 - ramp(t, 8.4, 9.0)} />
            )}
          </g>
        )}
        {/* 12 秒：太阳划过天空，过了中午柠檬熄灭 */}
        {t > 11.8 && (
          <g opacity={ramp(t, 11.8, 12.3)}>
            <path d="M 300 360 Q 640 40 980 360" fill="none" stroke={C.line} strokeWidth={2} strokeDasharray="4 10" />
            {(() => {
              const u = sunU;
              const x = (1 - u) * (1 - u) * 300 + 2 * (1 - u) * u * 640 + u * u * 980;
              const y = (1 - u) * (1 - u) * 360 + 2 * (1 - u) * u * 40 + u * u * 360;
              return <circle cx={x} cy={y} r={34} fill={C.amber} filter="url(#glowBig)" />;
            })()}
            <Drop x={640} y={450} s={0.9} o={noon ? 0.25 : 1} />
          </g>
        )}
      </Stage>
      <Flash k={pulse(t, 1.75, 0.3) * 0.6} color={LEMON} />
      <Flash k={pulse(t, 8.0, 0.35)} color={C.flip} />
      <Label x={PX1 + 30} y={PY1 + 30} o={ramp(t, 6.0, 6.5) * (1 - ramp(t, 7.9, 8.1))} size={34} weight={900}
        color={C.amber} align="left">相关 ≈ 0.7</Label>
      <Label x={640} y={70} o={ramp(t, 4.4, 4.9) * (1 - ramp(t, 7.9, 8.1))} size={22}>1967 · 100 人 · 4 滴柠檬汁</Label>
      <Label x={640} y={70} o={ramp(t, 8.1, 8.5) * (1 - ramp(t, 11.6, 12))} size={26} weight={900} color={C.flip}>
        1969 · 重做：没差别
      </Label>
      <Label x={400} y={430} o={ramp(t, 12.6, 13) * (1 - ramp(t, 15.2, 15.6))} size={30} weight={900} color={C.i}>上午 ✓</Label>
      <Label x={880} y={430} o={ramp(t, 13.8, 14.2) * (1 - ramp(t, 15.2, 15.6))} size={30} weight={900} color={C.flip}>下午 ✗</Label>
      <Label x={640} y={70} o={ramp(t, 12.3, 12.7) * (1 - ramp(t, 15.2, 15.6))} size={22}>1988 · 上下午各测一次</Label>
    </>
  );
};

/* ================= 16–24 秒：标题 + 标签 ================= */
export const Sticker: React.FC<{x: number; y: number; s?: number; rot?: number; peel?: number; o?: number}> =
  ({x, y, s = 1, rot = -6, peel = 0, o = 1}) => (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
      <rect x={-170} y={-80} width={340} height={160} rx={30} fill="#000" opacity={0.35} transform="translate(8 10)" />
      <rect x={-170} y={-80} width={340} height={160} rx={30} fill={C.i} />
      <text x={0} y={36} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={104} fill="#0a1a1a">i 人</text>
      {peel > 0 && (
        <>
          <path d={`M ${170 - 110 * peel} -80 L 170 -80 L 170 ${-80 + 90 * peel} Z`} fill={C.bg} />
          <path d={`M ${170 - 110 * peel} -80 L 170 ${-80 + 90 * peel} L ${170 - 70 * peel} ${-80 + 60 * peel} Z`}
            fill="#c9fff7" opacity={0.95} />
        </>
      )}
    </g>
  );

export const Title: React.FC<{t: number}> = ({t}) => {
  if (t < 15.9 || t > 24.2) return null;
  const slam = ramp(t, 16, 16.22, 'out');
  const peel = ramp(t, 20.3, 21.5, 'back');
  const o = 1 - ramp(t, 23.7, 24.1);
  return (
    <>
      <Stage o={o}>
        {peel > 0 && <circle cx={640 + 150} cy={330 - 90} r={80 + peel * 60} fill={C.amber} opacity={0.18 * peel}
          filter="url(#glowBig)" />}
        <Sticker x={640} y={360} s={1.8 - 0.8 * slam} peel={peel} />
      </Stage>
      <Flash k={pulse(t, 16, 0.4)} />
      <Big t={t} t0={16} t1={24} y={140} size={76} slam glow="#4fe3d055">i人真的话少吗？</Big>
    </>
  );
};

/* ================= 24–32 秒：MBTI 翻牌器 ================= */
const TYPES = ['INTJ', 'ENFP', 'ISFJ', 'ESTP'];
const FLIPPED = ['ENTJ', 'ENFJ', 'ISTJ', 'ISTP'];   // 一半的格子变了
const ALPHA = 'IENSTFJP';
export const Board: React.FC<{t: number}> = ({t}) => {
  if (t < 23.8 || t > 32.3) return null;
  const o = win(t, 24, 32.2);
  const jam = t > 30.4;
  const [sx, sy] = jam ? [Math.sin(t * 70) * 3, Math.cos(t * 60) * 2] : [0, 0];
  const bx = 330, by = 96, tw = 92, th = 106, gap = 12;
  const prog = ramp(t, 26.2, 27.9, 'lin');
  const changed = t >= 28;
  return (
    <>
      <Stage o={o} dx={sx} dy={sy}>
        {TYPES.map((row, r) => row.split('').map((ch, c) => {
          const settle = 24.4 + (r * 4 + c) * 0.07;
          const spinning = t < settle;
          const final = changed ? FLIPPED[r][c] : ch;
          const diff = changed && FLIPPED[r][c] !== ch;
          const letter = spinning ? ALPHA[Math.floor(t * 14 + r * 3 + c) % 8] : final;
          const flipK = diff ? pulse(t, 28 + (r + c) * 0.05, 0.25) : 0;
          const x = bx + c * (tw + gap), y = by + r * (th + gap);
          return (
            <g key={`${r}${c}`} transform={`translate(${x + tw / 2} ${y + th / 2}) scale(1 ${1 - flipK * 0.9})`}>
              <rect x={-tw / 2} y={-th / 2} width={tw} height={th} rx={10} fill="#141824" stroke={diff ? C.flip : C.line}
                strokeWidth={diff ? 3 : 1.5} filter={diff ? 'url(#glowSoft)' : undefined} />
              <line x1={-tw / 2} x2={tw / 2} y1={0} y2={0} stroke="#000" strokeWidth={2} opacity={0.6} />
              <text x={0} y={30} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={80}
                fill={diff ? C.flip : letter === 'I' ? C.i : letter === 'E' ? C.e : C.ink}>{letter}</text>
            </g>
          );
        }))}
        {/* 5 周进度条 */}
        <g opacity={ramp(t, 26, 26.3) * (1 - ramp(t, 28.0, 28.3))}>
          <rect x={880} y={330} width={280} height={12} rx={6} fill={C.line} />
          <rect x={880} y={330} width={280 * prog} height={12} rx={6} fill={C.amber} />
        </g>
        {/* 卡住冒烟 */}
        {jam && Array.from({length: 7}, (_, k) => {
          const u = (t - 30.4 - k * 0.12);
          if (u < 0) return null;
          return <circle key={k} cx={bx + 2 * (tw + gap) + (k - 3) * 30 + Math.sin(u * 3 + k) * 10} cy={by - 10 - u * 90}
            r={18 + u * 30} fill="#9aa3b5" opacity={Math.max(0, 0.35 - u * 0.2)} />;
        })}
      </Stage>
      <Label x={1020} y={278} o={o * ramp(t, 26, 26.3) * (1 - ramp(t, 28.0, 28.3))}
        size={22} color={C.ink}>隔 5 周，再测一次</Label>
      <Big t={t} t0={28.05} t1={32} x={1020} y={250} size={120} color={C.flip} glow="#ff4fa388" slam>≈50%</Big>
      <Label x={1020} y={390} o={o * ramp(t, 28.4, 28.8)} size={22} color={C.ink}>至少一个字母变了</Label>
      <Flash k={pulse(t, 28.0, 0.3) * 0.6} color={C.flip} />
    </>
  );
};

/* ================= 32–44 秒：设问 → 96 个录音器 → 两条声纹 ================= */
export const Recorder: React.FC<{t: number}> = ({t}) => {
  if (t < 31.8 || t > 44.3) return null;
  const qO = win(t, 32, 36.1);
  const micO = win(t, 36, 40.1);
  const vpO = win(t, 40, 44.2);
  const hrs = Math.floor(ramp(t, 36.8, 39.2, 'lin') * 48);
  return (
    <>
      <Stage o={qO} zoom={1 + ramp(t, 32, 36, 'lin') * 0.08}>
        <path d={Array.from({length: 120}, (_, k) => `${k ? 'L' : 'M'} ${160 + k * 8} ${360 + Math.sin(k * 0.5 + t * 6) * 30 * Math.sin(k / 120 * Math.PI)}`).join(' ')}
          fill="none" stroke={C.i} strokeWidth={2} opacity={0.4} filter="url(#glowSoft)" />
      </Stage>
      <Big t={t} t0={32} t1={36} y={190} size={260} color={C.amber} glow="#f7c96b66">?</Big>
      <Stage o={micO}>
        {Array.from({length: 96}, (_, k) => {
          const c = k % 12, r = Math.floor(k / 12);
          const x = 290 + c * 64, y = 130 + r * 52;
          const on = ramp(t, 36.1 + k * 0.012, 36.3 + k * 0.012);
          const lvl = 0.5 + 0.5 * Math.sin(t * 9 + k);
          return (
            <g key={k} opacity={0.3 + 0.7 * on}>
              <rect x={x - 7} y={y - 14} width={14} height={22} rx={7} fill={on > 0.5 ? (k % 3 ? C.i : C.e) : C.line} />
              <line x1={x} x2={x} y1={y + 8} y2={y + 16} stroke={C.dim} strokeWidth={2} />
              {on > 0.5 && <rect x={x + 10} y={y + 6 - lvl * 16} width={4} height={lvl * 16} fill={C.amber} opacity={0.7} />}
            </g>
          );
        })}
      </Stage>
      <Label x={640} y={560} o={micO} size={30} weight={900} color={C.amber}>{hrs} 小时</Label>
      <Stage o={vpO}>
        {[{y: 250, col: C.e, dens: 0.85, name: '外向'}, {y: 440, col: C.i, dens: 0.35, name: '内向'}].map((row, j) => (
          <g key={j}>
            {Array.from({length: 110}, (_, k) => {
              const show = ramp(t, 40.1 + k * 0.008, 40.2 + k * 0.008);
              const talk = rand(k, j + 7) < row.dens;
              const h = talk ? 20 + rand(k, j + 9) * 70 : 4;
              return <rect key={k} x={250 + k * 7.5} y={row.y - h / 2 * show} width={4} height={Math.max(2, h * show)} rx={2}
                fill={talk ? row.col : C.line} opacity={0.9} />;
            })}
          </g>
        ))}
      </Stage>
      <Label x={190} y={232} o={vpO} size={26} weight={900} color={C.e}>外向</Label>
      <Label x={190} y={422} o={vpO} size={26} weight={900} color={C.i}>内向</Label>
      <Label x={640} y={90} o={vpO} size={22}>2006 · 录音研究 · 平均值</Label>
    </>
  );
};

/* ================= 44–56 秒：一个人的指针，一天里演了个遍 ================= */
export const Swing: React.FC<{t: number}> = ({t}) => {
  if (t < 43.8 || t > 56.2) return null;
  const o = win(t, 44, 56.1);
  const zoom = mix(1.25, 1, ramp(t, 44, 45.5));
  const dayU = ramp(t, 48, 51.8, 'lin');
  const v = t < 48 ? -0.8 + 0.05 * Math.sin(t * 3) : dayNeedle(dayU);
  const trail = t > 48 ? Array.from({length: 24}, (_, k) => dayNeedle(Math.max(0, dayU - (24 - k) * 0.02))) : [];
  const cmp = ramp(t, 52, 52.6, 'out');
  const [sx, sy] = shake(t, 52, 8);
  const labels: [number, string][] = [[0, '早上'], [0.35, '上班'], [0.68, '饭局'], [1, '回家']];
  return (
    <>
      <Stage o={o * (1 - cmp)} zoom={zoom}>
        <Gauge x={640} y={300} r={170} v={v} trail={trail} />
        <Person x={640} y={520} s={2.2} color={C.ink} />
        {t > 48 && (
          <g>
            <rect x={340} y={580} width={600} height={6} rx={3} fill={C.line} />
            <rect x={340} y={580} width={600 * dayU} height={6} rx={3} fill={C.amber} />
          </g>
        )}
      </Stage>
      {labels.map(([u, s]) => (
        <Label key={s} x={340 + 600 * u} y={548} o={o * (1 - cmp) * ramp(t, 48 + u * 3.8 - 0.1, 48 + u * 3.8 + 0.2)}
          size={18} color={C.dim}>{s}</Label>
      ))}
      {/* 52 秒：一个人的摆幅 vs 两个人的差别，一样长 */}
      <Stage o={o * cmp} dx={sx} dy={sy}>
        <defs>
          <linearGradient id="ie" x1={340} x2={940} y1={0} y2={0} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor={C.i} />
            <stop offset={1} stopColor={C.e} />
          </linearGradient>
        </defs>
        <rect x={340} y={240} width={600 * ramp(t, 52.1, 52.9, 'out')} height={44} rx={22} fill="url(#ie)" filter="url(#glowSoft)" />
        <rect x={340} y={400} width={600 * ramp(t, 52.6, 53.4, 'out')} height={44} rx={22} fill="url(#ie)" filter="url(#glowSoft)" />
      </Stage>
      <Label x={640} y={190} o={o * ramp(t, 52.2, 52.6)} size={26} weight={900} color={C.ink}>一个人自己的起伏</Label>
      <Label x={640} y={350} o={o * ramp(t, 52.7, 53.1)} size={26} weight={900} color={C.ink}>人与人之间的差别</Label>
      <Big t={t} t0={53.6} t1={56} y={500} size={44} color={C.amber} glow="#f7c96b66">差不多大</Big>
      <Flash k={pulse(t, 52, 0.3) * 0.5} color={C.amber} />
    </>
  );
};
