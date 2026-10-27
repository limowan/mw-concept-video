import React from 'react';
import {C, mix, pulse, rand, ramp, shake, win} from './lib';
import {Flash, Person, SANS, Stage} from './fx';
import {Big, Label} from './text';
import {Gauge, dayNeedle} from './gauge';
import {Sticker} from './scenes1';

/* ================= 56–64 秒：撕掉标签，露出不停摆的指针 ================= */
export const Tear: React.FC<{t: number}> = ({t}) => {
  if (t < 55.8 || t > 64.2) return null;
  const o = win(t, 56, 64.1);
  const tear = ramp(t, 56, 56.9, 'out');
  const v = dayNeedle(((t - 56) / 3.2) % 1);
  const [sx, sy] = shake(t, 56, 9);
  return (
    <>
      <Stage o={o} dx={sx} dy={sy} zoom={1 + ramp(t, 57, 64, 'lin') * 0.06}>
        <Gauge x={640} y={400} r={190} v={v} glow={ramp(t, 60, 61) * 0.5}
          trail={Array.from({length: 10}, (_, k) => dayNeedle(Math.max(0, ((t - 56) / 3.2) % 1 - (10 - k) * 0.03)))} />
        <defs>
          <clipPath id="tearL"><rect x={0} y={0} width={640} height={720} /></clipPath>
          <clipPath id="tearR"><rect x={640} y={0} width={640} height={720} /></clipPath>
        </defs>
        {tear < 1 && (
          <>
            <g clipPath="url(#tearL)" transform={`translate(${-tear * 420} ${tear * 160}) rotate(${-tear * 25} 640 330)`}
              opacity={1 - tear}><Sticker x={640} y={330} s={1.1} /></g>
            <g clipPath="url(#tearR)" transform={`translate(${tear * 420} ${tear * 120}) rotate(${tear * 30} 640 330)`}
              opacity={1 - tear}><Sticker x={640} y={330} s={1.1} /></g>
          </>
        )}
      </Stage>
      <Flash k={pulse(t, 56, 0.3) * 0.5} />
      <Label x={640} y={470} o={o * ramp(t, 60.2, 60.8)} size={30} weight={900} color={C.amber}>同一个人</Label>
    </>
  );
};

/* ================= 64–72 秒：熟人话痨 / 生人哑巴；聚会散场 ================= */
const Bubble: React.FC<{x: number; y: number; w: number; col: string; o: number}> = ({x, y, w, col, o}) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <rect x={x - w / 2} y={y - 20} width={w} height={40} rx={20} fill={col} />
      {[0, 1, 2].map((k) => <circle key={k} cx={x - 16 + k * 16} cy={y} r={4} fill={C.bg} opacity={0.7} />)}
    </g>
  );

export const Daily: React.FC<{t: number}> = ({t}) => {
  if (t < 63.8 || t > 72.2) return null;
  const splitO = win(t, 64, 68.2);
  const partyO = win(t, 67.9, 72.1);
  const disperse = ramp(t, 68.4, 69.8, 'out');
  const vAlone = mix(0.8, -0.8, ramp(t, 68.6, 71.4));
  return (
    <>
      <Stage o={splitO}>
        <line x1={640} x2={640} y1={60} y2={600} stroke={C.line} strokeWidth={2} />
        <Gauge x={320} y={210} r={80} v={mix(-0.2, 0.85, ramp(t, 64.3, 65.2, 'back'))} labels={false} />
        <Gauge x={960} y={210} r={80} v={mix(-0.2, -0.85, ramp(t, 64.3, 65.2, 'back'))} labels={false} />
        {Array.from({length: 7}, (_, k) => {
          const t0 = 64.3 + k * 0.45;
          const up = ramp(t, t0, t0 + 0.3, 'back');
          return <Bubble key={k} x={320 + (k % 2 ? 70 : -60)} y={500 - k * 46 + (1 - up) * 20} w={90 + rand(k, 3) * 70}
            col={k % 2 ? C.e : C.i} o={up * (1 - ramp(t, 67.6, 68))} />;
        })}
        <Person x={320} y={560} s={1.5} color={C.i} />
        <Person x={960} y={560} s={1.5} color={C.i} />
        <text x={1010} y={470} fontFamily={SANS} fontWeight={900} fontSize={40} fill={C.dim}
          opacity={ramp(t, 65.5, 66)}>…</text>
      </Stage>
      <Label x={320} y={60} o={splitO} size={28} weight={900} color={C.e}>跟熟人</Label>
      <Label x={960} y={60} o={splitO} size={28} weight={900} color={C.dim}>跟生人</Label>
      <Stage o={partyO}>
        {Array.from({length: 70}, (_, k) => {
          const a = rand(k, 1) * Math.PI * 2 + t * (0.6 + rand(k, 2));
          const rr = 120 + rand(k, 3) * 220 + disperse * 600;
          return <circle key={k} cx={640 + Math.cos(a) * rr} cy={430 + Math.sin(a) * rr * 0.45} r={6 + rand(k, 4) * 6}
            fill={[C.e, C.flip, C.amber, C.i][k % 4]} opacity={0.85 * (1 - disperse)} />;
        })}
        <Gauge x={640} y={230} r={110} v={vAlone} />
        <circle cx={640} cy={520} r={90} fill={C.i} opacity={0.08 * disperse} filter="url(#glowBig)" />
        <Person x={640} y={560} s={1.8} color={C.i} />
      </Stage>
    </>
  );
};

/* ================= 72–80 秒：阶梯教室，逗笑全场 ================= */
export const Lecture: React.FC<{t: number}> = ({t}) => {
  if (t < 71.8 || t > 80.15) return null;
  const o = win(t, 72, 80.1, 0.3, 0.1);
  const lights = ramp(t, 72.2, 73);
  const laugh = t > 76 ? t - 76 : -1;
  return (
    <>
      <Stage o={o} zoom={1 + ramp(t, 72, 80, 'lin') * 0.05}>
        <polygon points="560,0 720,0 820,600 460,600" fill={C.amber} opacity={0.1 * lights} filter="url(#glowBig)" />
        {[0, 1, 2, 3].map((k) => {
          const y = 470 + k * 34;
          return (
            <g key={k} opacity={lights}>
              <path d={`M 80 ${y + 60} Q 640 ${y - 40} 1200 ${y + 60}`} fill="none" stroke={C.line} strokeWidth={2} />
              {Array.from({length: 16}, (_, j) => {
                const u = (j + 0.5) / 16;
                const x = 80 + u * 1120;
                const yy = (1 - u) * (1 - u) * (y + 60) + 2 * (1 - u) * u * (y - 40) + u * u * (y + 60) - 12;
                const bob = laugh > 0 ? Math.abs(Math.sin(laugh * 9 + j + k)) * 6 : 0;
                return Math.abs(x - 640) < 130 && k < 2 ? null :
                  <circle key={j} cx={x} cy={yy - bob} r={9} fill={C.dim} opacity={0.8} />;
              })}
            </g>
          );
        })}
        <Person x={640} y={430} s={1.7} color={C.e} o={lights} />
        <Gauge x={1090} y={150} r={70} v={mix(0.2, 0.95, ramp(t, 75.5, 76.4, 'back'))} o={lights} labels={false} />
        {laugh > 0 && Array.from({length: 40}, (_, k) => {
          const u = laugh - rand(k, 1) * 1.5;
          if (u < 0) return null;
          return <circle key={k} cx={120 + rand(k, 2) * 1040 + Math.sin(u * 3 + k) * 20} cy={560 - u * 140}
            r={3 + rand(k, 3) * 4} fill={C.amber} opacity={Math.max(0, 0.9 - u * 0.3)} filter="url(#glowSoft)" />;
        })}
        {laugh > 0 && Array.from({length: 10}, (_, k) => {
          const u = laugh - k * 0.25;
          if (u < 0) return null;
          return <text key={`h${k}`} x={160 + rand(k, 5) * 960} y={540 - u * 110} fontFamily={SANS} fontWeight={900}
            fontSize={34 + rand(k, 6) * 16} fill={C.amber} opacity={Math.max(0, 1 - u * 0.35)}>哈</text>;
        })}
      </Stage>
    </>
  );
};

/* ================= 80–96 秒：厕所隔间、抬脚、盖章、两个他 ================= */
export const Stall: React.FC<{t: number}> = ({t}) => {
  if (t < 79.95 || t > 96.2) return null;
  const o = win(t, 80, 96.1, 0.05, 0.3);
  const walk = ramp(t, 80.2, 82.2, 'lin');
  const close = ramp(t, 82.4, 82.62, 'out');
  const feetO = ramp(t, 83.0, 83.3);
  const lift = ramp(t, 85.5, 86.3, 'io');
  const stamp = ramp(t, 88, 88.18, 'out');
  const twin = ramp(t, 92, 93);
  const [sx, sy] = shake(t, 88, 10);
  const [cx2, cy2] = shake(t, 82.6, 4, 0.2);
  return (
    <>
      <Stage o={o} dx={sx + cx2} dy={sy + cy2}>
        <rect x={0} y={600} width={1280} height={120} fill="#0c0f16" />
        <line x1={0} x2={1280} y1={600} y2={600} stroke={C.line} strokeWidth={2} />
        {/* 走进去的人 */}
        {close < 1 && <Person x={mix(150, 600, walk)} y={598 - Math.abs(Math.sin(walk * 18)) * 6} s={1.8} color={C.i}
          o={1 - ramp(t, 82.2, 82.5)} />}
        {/* 门：从半开甩到关上 */}
        <g transform={`translate(470 0) scale(${mix(0.18, 1, close)} 1) translate(-470 0)`}>
          <rect x={470} y={70} width={340} height={490} rx={8} fill="#1b2130" stroke={C.line} strokeWidth={3} />
          <circle cx={780} cy={330} r={9} fill={C.dim} />
          <rect x={640} y={110} width={80} height={28} rx={6} fill={C.flip} opacity={0.0 + 0.9 * close} />
        </g>
        <text x={680} y={130} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={18} fill="#fff"
          opacity={close}>有人</text>
        {/* 门下缝隙里的脚，85.5 秒抬起来消失 */}
        <defs><clipPath id="gap"><rect x={470} y={560} width={340} height={40} /></clipPath></defs>
        <g clipPath="url(#gap)" opacity={feetO}>
          {[600, 660].map((x) => (
            <rect key={x} x={x} y={584 - lift * 60} width={44} height={16} rx={8} fill={C.i} />
          ))}
        </g>
        {/* 92 秒：门上投出讲台上的他（暖橙）和隔间里的他（冷青） */}
        <g opacity={twin}>
          <g transform="translate(640 520) scale(4.2)" fill="none" stroke={C.e} strokeWidth={0.9} filter="url(#glowSoft)">
            <circle cx={0} cy={-38} r={13} />
            <path d="M -20 0 Q -20 -22 0 -22 Q 20 -22 20 0 Z" />
          </g>
          <Person x={640} y={470} s={1.6} color={C.i} />
        </g>
        {/* 88 秒：盖章 */}
        {stamp > 0 && (
          <g transform={`translate(640 300) rotate(-12) scale(${1.7 - 0.7 * stamp})`} opacity={Math.min(1, stamp * 2) * (1 - 0.85 * twin)}>
            <rect x={-170} y={-52} width={340} height={104} rx={10} fill="none" stroke={C.flip} strokeWidth={8} />
            <text x={0} y={24} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={66} fill={C.flip}>极度内向</text>
          </g>
        )}
      </Stage>
      <Flash k={pulse(t, 88, 0.3) * 0.5} color={C.flip} />
    </>
  );
};

/* ================= 96–108 秒：装外向，当下开心，几小时后更累；小灯亮起 ================= */
export const Mood: React.FC<{t: number}> = ({t}) => {
  if (t < 95.8 || t > 108.2) return null;
  const gO = win(t, 96, 104.1);
  const lampO = win(t, 103.9, 108.1);
  const rise = ramp(t, 96.2, 97.8);
  const fog = ramp(t, 100.2, 102.8, 'io');
  const curve = Array.from({length: 80}, (_, k) => {
    const u = k / 79;
    const y = 470 - 260 * Math.sin(Math.min(1, u / 0.45) * Math.PI / 2) * (u < 0.55 ? 1 : 1 - (u - 0.55) * 0.3);
    return [260 + u * 760, y] as const;
  });
  const shown = Math.max(2, Math.floor(curve.length * (t < 100 ? rise * 0.5 : 0.5 + 0.5 * fog)));
  return (
    <>
      <Stage o={gO}>
        <defs>
          <linearGradient id="moodG" x1={260} x2={1020} y1={0} y2={0} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor={C.e} />
            <stop offset={Math.max(0, 0.5 + 0.5 * fog - 0.15)} stopColor={C.e} />
            <stop offset={Math.min(1, 0.5 + 0.5 * fog)} stopColor="#7a8090" />
            <stop offset={1} stopColor="#7a8090" />
          </linearGradient>
        </defs>
        <line x1={260} x2={1020} y1={500} y2={500} stroke={C.line} strokeWidth={2} />
        <path d={curve.slice(0, shown).map((p, k) => `${k ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ')} fill="none"
          stroke="url(#moodG)" strokeWidth={5} strokeLinecap="round" filter="url(#glow)" />
        {fog > 0 && Array.from({length: 9}, (_, k) => (
          <circle key={k} cx={180 + fog * 640 - k * 50} cy={260 + rand(k, 1) * 220} r={70 + rand(k, 2) * 50}
            fill="#8d93a3" opacity={0.08 * (1 - ramp(t, 103.6, 104))} filter="url(#glowBig)" />
        ))}
      </Stage>
      <Label x={560} y={150} o={gO * ramp(t, 97.2, 97.7)} size={30} weight={900} color={C.e}>当下：更开心</Label>
      <Label x={900} y={530} o={gO * ramp(t, 100.3, 100.8)} size={22} color={C.dim}>几小时后 →</Label>
      <Label x={880} y={300} o={gO * ramp(t, 102, 102.6)} size={30} weight={900} color="#aab0bf">更累</Label>
      <Stage o={lampO}>
        <rect x={470} y={90} width={340} height={470} rx={10} fill="#141a26" stroke={C.line} strokeWidth={3} />
        <circle cx={640} cy={180} r={30 + 50 * ramp(t, 104.3, 106)} fill={C.amber} opacity={0.25 * ramp(t, 104.3, 106)} filter="url(#glowBig)" />
        <circle cx={640} cy={180} r={14} fill={C.amber} opacity={ramp(t, 104.3, 105)} filter="url(#glow)" />
        <Person x={640} y={520} s={1.6} color={C.i} />
      </Stage>
    </>
  );
};

/* ================= 108–116 秒：噪音旋钮 ================= */
const Knob: React.FC<{x: number; y: number; ang: number; col: string}> = ({x, y, ang, col}) => (
  <g>
    <circle cx={x} cy={y} r={92} fill="#141a26" stroke={C.line} strokeWidth={3} />
    {Array.from({length: 11}, (_, k) => {
      const a = (-135 + k * 27) * Math.PI / 180;
      return <line key={k} x1={x + Math.sin(a) * 104} y1={y - Math.cos(a) * 104} x2={x + Math.sin(a) * 116}
        y2={y - Math.cos(a) * 116} stroke={C.dim} strokeWidth={2} />;
    })}
    <g transform={`rotate(${ang} ${x} ${y})`}>
      <line x1={x} y1={y} x2={x} y2={y - 72} stroke={col} strokeWidth={10} strokeLinecap="round" filter="url(#glow)" />
    </g>
    <circle cx={x} cy={y} r={14} fill={col} />
  </g>
);

export const Knobs: React.FC<{t: number}> = ({t}) => {
  if (t < 107.8 || t > 116.2) return null;
  const o = win(t, 108, 116.1);
  const turn = ramp(t, 108.5, 109.6, 'back');
  const fill = ramp(t, 112.1, 113.4, 'out');
  return (
    <>
      <Stage o={o}>
        {[{x: 450, a: mix(0, -80, turn), col: C.i, amp: 0.35}, {x: 830, a: mix(0, 95, turn), col: C.e, amp: 1}].map((k, j) => (
          <g key={j}>
            {[0, 1, 2].map((r) => {
              const u = ((t * 0.8 + r / 3) % 1);
              return <circle key={r} cx={k.x} cy={300} r={100 + u * 90 * k.amp + 20} fill="none" stroke={k.col}
                strokeWidth={2} opacity={(1 - u) * 0.4 * turn} />;
            })}
            <Knob x={k.x} y={300} ang={k.a} col={k.col} />
            <rect x={k.x - 110} y={480} width={220} height={16} rx={8} fill={C.line} />
            <rect x={k.x - 110} y={480} width={220 * fill} height={16} rx={8} fill={k.col} filter="url(#glowSoft)" />
          </g>
        ))}
      </Stage>
      <Label x={450} y={150} o={o} size={28} weight={900} color={C.i}>内向</Label>
      <Label x={830} y={150} o={o} size={28} weight={900} color={C.e}>外向</Label>
      <Label x={640} y={520} o={o * ramp(t, 112.6, 113.2)} size={24} weight={700} color={C.ink}>在自己选的音量里，都学得更好</Label>
      <Label x={640} y={70} o={o * ramp(t, 108.3, 108.8)} size={22}>1984 · 噪音实验 · 音量自己调</Label>
    </>
  );
};

/* ================= 116–124 秒：“你怎么话这么少？” → 一键静音，指针甩回 i ================= */
export const Comeback: React.FC<{t: number}> = ({t}) => {
  if (t < 115.8 || t > 124.2) return null;
  const o = win(t, 116, 124.1);
  const pop = ramp(t, 116.1, 116.5, 'back');
  const noise = ramp(t, 116.8, 119.6) * (1 - ramp(t, 120, 120.5, 'out'));
  const fly = ramp(t, 120, 120.6, 'io');
  const g = ramp(t, 120, 120.5, 'back');
  const v = t < 120 ? 0.7 + 0.15 * Math.sin(t * 20) * noise : mix(0.85, -0.8, ramp(t, 120.05, 120.5, 'back'));
  return (
    <>
      <Stage o={o}>
        {Array.from({length: 9}, (_, k) => {
          const y = 80 + k * 64;
          return <path key={k} d={Array.from({length: 66}, (_, j) => `${j ? 'L' : 'M'} ${j * 20} ${y + Math.sin(j * 1.3 + t * 14 + k) * 26 * noise * (0.5 + rand(j, k))}`).join(' ')}
            fill="none" stroke={C.flip} strokeWidth={2} opacity={0.15 + 0.45 * noise} />;
        })}
        <g transform={`translate(640 ${250 - fly * 400}) scale(${pop})`} opacity={1 - fly}>
          <rect x={-250} y={-60} width={500} height={120} rx={60} fill={C.ink} />
          <path d="M -120 56 L -150 100 L -80 58 Z" fill={C.ink} />
          <text x={0} y={16} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={46} fill="#111">你怎么话这么少？</text>
        </g>
        <Gauge x={640} y={400} r={165} v={v} o={g} glow={ramp(t, 120.3, 121) * (1 - ramp(t, 123.5, 124))} />
      </Stage>
      <Flash k={pulse(t, 120, 0.35) * 0.45} color={C.amber} />
    </>
  );
};

/* ================= 124–132 秒：聊到天亮；指针回到中间 ================= */
export const Dawn: React.FC<{t: number}> = ({t}) => {
  if (t < 123.8 || t > 132.4) return null;
  const o = win(t, 124, 132.3, 0.3, 0.5);
  const sky = ramp(t, 124.3, 129.5);
  const night = [0x0b, 0x12, 0x30], dawn = [0xff, 0xb3, 0x7a];
  const col = `rgb(${night.map((c, k) => Math.round(mix(c, dawn[k], sky))).join(',')})`;
  const v = t < 128 ? mix(-0.6, 0.55, ramp(t, 124.4, 127.6)) : mix(0.55, 0, ramp(t, 128, 128.8, 'back'));
  return (
    <Stage o={o}>
      <defs>
        <linearGradient id="sky" x1={0} x2={0} y1={90} y2={400} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor="#0b1230" />
          <stop offset={1} stopColor={col} />
        </linearGradient>
      </defs>
      <rect x={340} y={90} width={600} height={300} rx={14} fill="url(#sky)" stroke={C.line} strokeWidth={4} />
      <line x1={640} x2={640} y1={90} y2={390} stroke={C.line} strokeWidth={4} />
      <circle cx={640} cy={390 - sky * 90} r={34} fill={C.amber} opacity={sky} filter="url(#glowBig)" />
      <rect x={470} y={520} width={340} height={14} rx={7} fill={C.line} />
      <Person x={500} y={560} s={1.5} color={C.i} />
      <Person x={780} y={560} s={1.5} color={C.e} />
      {Array.from({length: 6}, (_, k) => {
        const t0 = 124.4 + k * 0.6;
        const up = ramp(t, t0, t0 + 0.25, 'back') * (1 - ramp(t, t0 + 1.2, t0 + 1.5));
        const left = k % 2 === 0;
        return up > 0 ? (
          <g key={k} opacity={up} transform={`translate(${left ? 560 : 720} ${470 - up * 20})`}>
            <rect x={-40} y={-18} width={80} height={36} rx={18} fill={left ? C.i : C.e} />
            {[0, 1, 2].map((j) => <circle key={j} cx={-14 + j * 14} cy={0} r={4} fill={C.bg} opacity={0.7} />)}
          </g>
        ) : null;
      })}
      <Gauge x={1110} y={250} r={80} v={v} glow={ramp(t, 128.2, 128.9) * (1 - ramp(t, 131.5, 132))} labels={false} />
    </Stage>
  );
};

/* ================= 132–141 秒：落款 ================= */
export const Dedication: React.FC<{t: number}> = ({t}) => {
  if (t < 131.8) return null;
  const o = 1 - ramp(t, 138.4, 139.6);
  const burst = ramp(t, 132, 134.5, 'out');
  return (
    <>
      <Stage o={o}>
        {Array.from({length: 60}, (_, k) => {
          const a = rand(k, 1) * Math.PI * 2;
          const rr = burst * (120 + rand(k, 2) * 380);
          return <circle key={k} cx={640 + Math.cos(a) * rr} cy={300 + Math.sin(a) * rr * 0.6} r={2 + rand(k, 3) * 3}
            fill={k % 2 ? C.i : C.amber} opacity={(1 - burst) * 0.9 + 0.15} filter="url(#glowSoft)" />;
        })}
      </Stage>
      <Big t={t} t0={132.3} t1={139.6} y={250} size={46} weight={700} spacing="0.08em">致每一个，</Big>
      <Big t={t} t0={132.8} t1={139.6} y={320} size={46} weight={700} spacing="0.08em">
        还没遇到对的场子的 <span style={{color: C.i, textShadow: `0 0 18px ${C.i}88`}}>i 人</span>。
      </Big>
    </>
  );
};
