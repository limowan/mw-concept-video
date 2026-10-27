import {Config} from '@remotion/cli/config';

// 渲染默认值；需要时在命令行覆盖（例：--scale=2 导出 2K）
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
