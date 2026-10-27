# 画面：用 Remotion 写代码画

模板在 `template/`，是一个能直接跑的 Remotion 工程（React + SVG）。下面是写画面时的套路和踩过的坑。

## 工程结构

```
src/
├── index.ts / Root.tsx   注册两个合成：Video（带音频，出成片）、Silent（不带音频，抽帧质检用）
├── Video.tsx             合成顺序：背景 → 微尘 → 各场景 → 字幕 → 颗粒暗角 → 结尾黑场
├── lib.ts                尺寸、时长、配色，以及 ramp / win / pulse / shake / rand 等时间函数
├── fx.tsx                字体加载、背景、微尘、颗粒、发光滤镜、Stage（推拉镜头）、闪光
├── text.tsx              字幕、大字（Big）、小标注（Label）
├── subs.ts               字幕时间轴（唯一来源，画面和配乐都按它卡点）
└── scenes*.tsx           按题目写的场景；主角做成单独的图元文件（如 pear.tsx）
```

制作尺寸 1280×720@30fps，成片用 `--scale=2` 导出 2560×1440。

## 写场景的套路

- **一切按秒算**：`const t = frame / FPS`，场景组件收 `t`，用 `ramp(t, a, b)` 做 0→1 的过渡，`win(t, a, b)` 做淡入淡出
- **每个场景自己判断时间段**：`if (t < 20.8 || t > 29.2) return null;` 前后各留 0.2 秒和相邻场景重叠，避免切换时闪黑
- **推拉镜头**：把一整个场景包进 `<Stage zoom cx cy dx dy>`，改 zoom 和平移；要推近某个元素，就把它挪到中心附近再放大
- **砸下来的大字**：`<Big slam>`，由 1.7 倍缩到 1 倍，0.2 秒，配一记重音和一下 `shake`
- **逐个入场**：`ramp(t, t0 + k * 0.2, t0 + k * 0.2 + 0.3, 'back')`，k 是第几个
- **随机要稳定**：用 `rand(k, salt)`，不要用 `Math.random()`，否则每帧不一样、画面会闪
- **小律动防静止**：每个场景内部至少有一样东西一直在动（呼吸的光、绕圈的光点、慢推镜头、上浮的粒子）

## 版面安全区

- 底部字幕在 y = 622 左右，**画面内容不要压到 y > 600**
- 画面标注不小于 18 像素；数字、标签不和曲线、别的字重叠
- 主角占画面足够大：开场的主角高度至少占画面的三分之一

## 踩过的坑

- **SVG 发光滤镜让直线消失**：默认按包围盒算，纯竖线 / 横线的宽或高是 0，带滤镜的线整条不见。模板里的滤镜已经用 `filterUnits="userSpaceOnUse"` + 固定大区域
- **字体**：中文字体用 FontFace 从 `public/fonts` 加载，加载完再 `continueRender`；字体没下载时模板会退回系统字体，但成片前一定要装好
- **渐变 / 遮罩的 id 要唯一**：同一个图元在一帧里出现多次时，`id` 带上前缀（`<Pear id="p1">`），否则互相串
- **镜头推拉别把东西推出画面、压到字幕**：改完推拉一定抽帧看
- **跟着旋转的标签会飘**：整体旋转的图形，旁边的文字标签固定在两侧，不要跟着转
- **渲染时别加 `--log=error`**：看不到进度
- **Windows**：中断渲染后用 `taskkill //PID <pid> //T //F` 清掉残留的 chrome-headless 和 ffmpeg

## 质检

```bash
npx remotion bundle src/index.ts --out-dir build
python <Skill>/tools/contact_sheet.py 名字 0 1 2 4.3 8 12.1 16 20       # → qc/名字.png
npx remotion render build Video 产物/样片_0-20秒.mp4 --frames=0-614 --codec=h264 --crf=16 --scale=2
python <Skill>/tools/rhythm.py 产物/成片.mp4 --subs src/subs.ts --seg 0-3 --seg 证据段起-止
```

联系表逐张看：字幕挂太久、文字重叠、元素出画、内容压字幕、截图里的字看不清、数字说过头。

`rhythm.py` 输出三项：大变化的平均间隔和最长空档、字幕切换对齐率、超过 2 秒的静止段（会列出时间点，回去给那几段加律动）。注意：画面一直在动的片段，“大变化”的门槛会被抬高（按全片中位数的 3 倍算），这时看绝对数值和联系表判断。

## 成片

```bash
npx remotion render build Video 产物/{主题}_2K.mp4 --codec=h264 --crf=16 --scale=2 --concurrency=12 --audio-bitrate=320k
```

2 分多钟的片子渲染要几分钟，放后台跑。
