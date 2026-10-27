import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, LENGTH_S, ramp} from './lib';
import {Background, Dust, Fonts, Grain} from './fx';
import {Subtitle} from './text';
import {Opening, Title} from './scenes';

/**
 * 合成顺序：背景 → 微尘 → 各场景 → 字幕 → 颗粒暗角 → 结尾黑场。
 * mute=true 是 Silent 合成，抽帧质检用；Video 合成需要 public/music.wav。
 */
export const Video: React.FC<{mute?: boolean}> = ({mute}) => {
  const t = useCurrentFrame() / FPS;
  const black = ramp(t, LENGTH_S - 0.8, LENGTH_S);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <Fonts />
      {!mute && <Audio src={staticFile('music.wav')} />}
      <Background warm={t < 12 ? 0.5 : 0.8} />
      <Dust t={t} />
      <Opening t={t} />
      <Title t={t} />
      <Subtitle t={t} />
      <Grain />
      {black > 0 && <AbsoluteFill style={{backgroundColor: '#000', opacity: black}} />}
    </AbsoluteFill>
  );
};
