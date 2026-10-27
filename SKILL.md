---
name: mw-concept-video
description: 用代码做 2–3 分钟的概念类科普短片：纯原创配乐 + 字幕，不配人声，深色底发光图形，Remotion 画面 + Python 代码写谱。覆盖选题、调研核实、视频文稿、前 15 秒样片、全片、抽帧和节奏质检、2K 成片。当用户说"做个科普视频""用代码做个概念短片""把这个概念/理论/心理学现象做成视频""像《i人真的话少吗》那样做一支"，或要解释哲学、心理学、认知偏误、思维模型、生活现象背后的原理时使用。需要真人口播、配音旁白或实拍素材剪辑的视频不适用。
---

# mw-concept-video：代码做概念科普短片

一支片子讲透一个打中人的洞见：第 0 帧就抛出问题，一个“东西”贯穿全片，每句字幕画面都在变，配乐卡着字幕走，结尾回到开头那个东西。

**所有画面用代码画，所有配乐用代码写**，不用网络图片、不用版权音乐，抖音、小红书、B站都能发。

下文 `<Skill>` 指本 Skill 文件夹的绝对路径（`SKILL.md` 所在目录）。

## 资源索引（按需读，不要一次全读）

| 文件 | 内容 | 什么时候读 |
|---|---|---|
| `references/design-guide.md` | 设计指南：选题、叙事结构、前 2 秒、文案、视觉、画面节奏、配乐卡点 | 开工前读一遍；讨论选题时必读 |
| `references/script-and-research.md` | 调研分级、视频文稿写法、爽点类型、两份模板和检查清单 | 写调研、写文稿时 |
| `references/visuals.md` | Remotion 工程结构、写场景的套路、版面安全区、踩过的坑、质检和渲染命令 | 写画面时 |
| `references/music.md` | scorekit 写谱用法、乐器和音效、卡点、混音、体检标准 | 写配乐时 |
| `template/` | 能直接跑的 Remotion 工程 + 示例谱子（16 秒演示开场） | 新建项目时复制 |
| `examples/introvert/` | 完整样例《i人真的话少吗》：调研、文稿、全部场景代码、谱子 | 想看一支完整片子怎么写时 |

## 环境检查（第一次用先跑）

```bash
python <Skill>/tools/check_deps.py
```

需要：Node.js 18+、npm、ffmpeg、Python 3.10+（numpy、scipy、pillow）。缺什么告诉用户怎么装，**不要替用户装全局依赖**。

乐器采样第一次要下载（121 个 wav，约 330MB，CC0）：

```bash
python <Skill>/music/fetch_samples.py
```

下载前告诉用户大小，用户同意再下。

## 工作流

```
选题【停】→ 建项目 → 调研 → 视频文稿【停】→ 前 15 秒样片【停】→ 全片 + 全曲 → 质检 → 成片
```

带【停】的地方必须把结果给用户看，等用户确认再往下走。每个阶段做完，在视频项目根目录记一个检查点（见文末“检查点”）。

### 1. 选题【停】

读 `references/design-guide.md` 第一、二节。和用户聊清楚：

- 核心问题（第 0 秒那句字幕，具体、反常识）
- 一句话答案
- 一物到底：哪个能画出来的东西贯穿全片，它在全片里换哪几种形态
- 证据：有哪些可核实的实验、历史、原文
- 转折：讲到哪里拆自己一下
- 结尾：怎么落回观众的生活

给 2–3 个方向让用户选，不要直接替用户定。题目太大（一整本书、一整套理论）先找一个具体切口。

### 2. 建项目

项目文件夹建在用户指定的位置，命名 `YYYY-MM-DD-主题`（日期由用户指定，没指定用今天）。

```bash
cp -r <Skill>/template/. <项目>/
mkdir -p <项目>/产物 <项目>/文档 <项目>/qc
```

然后：

1. 把 `<项目>/score/score.py` 里的 `{{SKILL_DIR}}` 换成 `<Skill>` 的绝对路径（或者让用户设环境变量 `MW_CONCEPT_VIDEO_DIR`）
2. 在 `<项目>` 里跑 `npm install`
3. `python <Skill>/tools/fetch_fonts.py <项目>`：下载思源黑体、思源宋体到 `public/fonts/`
4. `python <Skill>/tools/make_grain.py <项目>`：生成胶片颗粒 `public/grain.png`
5. `npm run typecheck`，通过后 `npx remotion studio src/index.ts` 可以预览模板的 16 秒演示

项目结构：

```
YYYY-MM-DD-主题/
├── 产物/        样片和成片 mp4
├── 文档/        调研.md、视频文稿.md
├── src/         Remotion 代码（subs.ts 是字幕时间轴，唯一来源）
├── score/       score.py 配乐谱子，out/ 是渲染结果
├── public/      fonts/、grain.png、music.wav
└── qc/          抽帧联系表
```

### 3. 调研

按 `references/script-and-research.md` 第一节写 `文档/调研.md`：来源分 A/B/C 三级，C 级不用；每个核心证据都查原始出处、后来有没有被推翻、数字的准确说法。核心论点站不住就改论点。

### 4. 视频文稿【停】

按 `references/script-and-research.md` 第二节写 `文档/视频文稿.md`：先写能连着读的整段文案，再切成逐句表（一句 12–20 字、约 4 秒），每句同时写字幕、爽点、画面怎么变、配乐和音效。写完数爽点、过检查清单，交给用户确认。

用户改了措辞，直接覆盖原文件，不存 v1 / v2。

### 5. 前 15 秒样片【停】

开头最决定数据，先只做开头给用户看：

1. `src/subs.ts` 写前几句字幕，`src/lib.ts` 定配色和总时长
2. 写开头场景（参考 `references/visuals.md`；模板的 `scenes.tsx` 是示例，按题目重写）
3. 写 `score/score.py` 的 demo 段，`python score/score.py demo`，跑体检，把 `score/out/demo/mix_-14LUFS.wav` 复制成 `public/music.wav`
4. 抽帧联系表自查，再渲染样片到 `产物/样片_0-15秒.mp4`

告诉用户样片路径，让用户看画面、听配乐、读开头那句话。**AI 听不见声音，配乐好不好听只能由用户判断。**

### 6. 全片 + 全曲

按文稿逐段写场景和谱子。每写完一段就抽帧看，不要等全部写完再查。改了字幕时间，谱子同步改。

### 7. 质检

```bash
npx remotion bundle src/index.ts --out-dir build
python <Skill>/tools/contact_sheet.py 段名 秒1 秒2 ...        # → qc/段名.png，逐张看
python <Skill>/music/check_audio.py score/out/full 段落... --hit 卡点秒...
python <Skill>/tools/rhythm.py 产物/成片.mp4 --subs src/subs.ts --seg 证据段起-止
```

联系表查：字幕挂太久、文字重叠、元素出画、内容压字幕带、截图里的字看不清、数字说过头。

节奏目标（转折段例外）：证据段大变化平均间隔 ≤ 6 秒（超过 8 秒返工）、字幕切换对齐率 ≥ 90%、超过 2 秒的静止段 0 处。不达标就回去加画面变化，再测。

### 8. 成片

```bash
npx remotion render build Video 产物/{主题}_2K.mp4 --codec=h264 --crf=16 --scale=2 --concurrency=12 --audio-bitrate=320k
```

2 分多钟的片子要渲染几分钟，放后台跑，别加 `--log=error`。

### 9. 收尾

```bash
bash <Skill>/tools/check_completion.sh <项目>
```

## 常用命令

| 做什么 | 命令（在视频项目根目录） |
|---|---|
| 类型检查 | `npm run typecheck` |
| 实时预览 | `npx remotion studio src/index.ts` |
| 打包（抽帧、渲染前） | `npx remotion bundle src/index.ts --out-dir build` |
| 渲染配乐 | `python score/score.py demo` / `python score/score.py full` |
| 配乐体检 | `python <Skill>/music/check_audio.py score/out/full 0-20 --hit 0 16` |
| 抽帧联系表 | `python <Skill>/tools/contact_sheet.py 名字 0 2 4 8` |
| 渲染一段 | `npx remotion render build Video 产物/样片.mp4 --frames=0-449 --codec=h264 --crf=16 --scale=2` |
| 节奏测量 | `python <Skill>/tools/rhythm.py 产物/成片.mp4 --subs src/subs.ts` |

## 底线

**诚实**

- 引号里的话一律逐字原文，查到原文再用；不凭记忆、不自己概括后挂在别人名下
- 数字只用核实过的；拿不准用约数，画面和字幕说法一致
- 实验后来被推翻、有争议的，要么不讲，要么讲清楚
- 不说“已经做完”，除非真的渲染出来、质检过了

**平台**

- 字幕和片中文字不用“最”“第一”“官方”及其组合（最高、第一次……），用“能到”“头一回”替代
- 政治、宗教、医疗等敏感题材，称呼和措辞先和用户确认

**原创**

- 画面全部代码绘制，不用网络图片、影视截图
- 每支片子按题目原创视觉，不复用上一支的动画；参考别人的片子只学节奏和结构，不照搬画面和文案

**文件**

- 视频文稿、调研各只保留一份，改动直接覆盖
- 删除文件前先列清单问用户

## 检查点

7 个阶段：选题、调研、视频文稿、样片、全片、质检、成片。每完成一个，在视频项目根目录执行：

```bash
echo "选题_DONE" >> .check_status
```

对话里同时输出 `[✓ 选题完成]`。全部做完跑 `tools/check_completion.sh`，它会核对阶段标记和产物文件，然后删掉 `.check_status`；在对话里确认“临时文件已删除”。

## Windows 注意

- Python 脚本已经内置 UTF-8 输出；别的脚本出现中文乱码时加 `PYTHONUTF8=1`
- 路径里有中文时用引号包起来
- 中断渲染后残留的 chrome-headless、ffmpeg 用 `taskkill //PID <pid> //T //F` 清掉
- `check_completion.sh` 需要 Git Bash
