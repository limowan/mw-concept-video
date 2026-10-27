import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, TOTAL_FRAMES, W} from './lib';
import {Video} from './Video';

export const Root: React.FC = () => (
  <>
    <Composition id="Video" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Silent" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H}
      defaultProps={{mute: true}} />
  </>
);
