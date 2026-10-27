import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, ramp} from './lib';
import {Background, Fonts, Grain} from './fx';
import {Subtitle} from './text';
import {Board, Lemon, Recorder, Swing, Title} from './scenes1';
import * as S2 from './scenes2';

export const Video: React.FC<{mute?: boolean}> = ({mute}) => {
  const t = useCurrentFrame() / FPS;
  const black = ramp(t, 139.2, 140.6);
  const tint = t < 56 ? 0.4 : t < 92 ? 0.6 : 0.5;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <Fonts />
      {!mute && <Audio src={staticFile('music.wav')} />}
      <Background tint={tint} />
      <Lemon t={t} />
      <Title t={t} />
      <Board t={t} />
      <Recorder t={t} />
      <Swing t={t} />
      {(Object.values(S2) as React.FC<{t: number}>[]).map((Scene, k) => <Scene key={k} t={t} />)}
      <Subtitle t={t} />
      <Grain />
      {black > 0 && <AbsoluteFill style={{backgroundColor: '#000', opacity: black}} />}
    </AbsoluteFill>
  );
};
