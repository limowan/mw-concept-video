# 配乐：用代码写谱

不用买版权音乐，也不用 AI 生成音乐：钢琴和弦乐用 VSCO 2 Community Edition 的采样（CC0，商用不用署名），拨弦和音效用代码合成，旋律和编曲都是自己写的，抖音、小红书、B站都能发。

## 准备

```bash
python <Skill>/music/fetch_samples.py      # 首次使用，下载 121 个采样，约 330MB
```

第一次渲染会把采样解码成缓存（`music/samples/_cache/`，约 470MB），之后就快了。缓存可以随时删。

## 写谱

谱子放在视频项目的 `score/score.py`，模板里有一份能直接跑的示例。

```python
from scorekit import Score, note_num as N
s = Score(length=141)                                  # 全片秒数
s.note('piano', 3.0, N('A5'), vel=0.4, dur=2.0)        # 第 3 秒，钢琴 A5
s.pad('cello', 18.0, [N('D2')], dur=5.0, vel=0.5)      # 第 18 秒，大提琴长音铺底
s.sfx('riser', 18.0, align='end')                      # 上扬音在 18 秒结束（对准重击）
s.sfx('impact', 18.0)                                  # 18 秒重击
s.render('out/full', stem_gain={...}, eq=[...])        # 写出 stems/*.wav、mix.wav、mix_-14LUFS.wav
```

- **乐器**：piano（立式钢琴，两档力度）、cello / viola / violins（弦乐群长音）、pluck（代码合成的拨弦）
- **音效**：impact 重击、riser 上扬、subdrop 重低音、tick 嘀嗒、whoosh 嗖、drip 水滴、scratch 唱片刮擦、flip 翻牌、tear 撕纸、click 门锁、crunch 咬一口、pencil 铅笔沙沙、zip 拉链。都是代码合成，可以照着写新的，注册进 `scorekit.SFX`

## 卡点

- **速度跟字幕走**：一句字幕 = 整数个小节。一句 4 秒用 120 BPM（两小节），一句 5 秒用 96 BPM（两小节）
- 写一个 `at(bar, beat)` 函数把小节换算成秒，所有音符都按小节写，卡点自然准
- 卡点表见 `design-guide.md` 第六节：第 0 秒有声音、标题前蓄力、标题重击、转折抽空、最后一句才解决、落款重现开头动机
- 画面里的关键动作（咬一口、链条卡住、数字砸出）配对应的音效，时间和画面同一秒

## 混音参考

```python
GAINS = {'piano': 0.7, 'pluck': 2.2, 'cello': 0.5, 'viola': 0.85, 'violins': 0.8, 'sfx': 0.4}
EQ = [('peak', 110, -5.0, 0.8), ('peak', 300, -3.0, 0.9), ('highshelf', 2500, 4.0)]
```

- 引擎会把每件乐器校准到同一响度，再按 GAINS 调比例
- 母带：整体增益 + 限幅到 -14 LUFS、真峰值约 -1.5 dB；不用会压缩动态的响度归一（会把安静的开场压得和高潮一样响）

## 体检（每次渲染后跑）

```bash
python <Skill>/music/check_audio.py score/out/full 0-20 20-56 --hit 0 16 24
```

| 看什么 | 合格标准 |
|---|---|
| 整体响度 | -14 LUFS 左右 |
| 真峰值 | 不超过 -1 dB |
| 每秒音量 | 第 0 秒高于 -20 dB；连续 10 秒低于 -35 dB 的段落要垫一层 |
| 卡点 | `--hit` 列的秒数附近有明显的能量突增 |
| 咔哒点 | 0 个 |
| 频段占比 | 80–250Hz 超过一半说明发闷，用 EQ 压低频、提高频 |

## 踩过的坑

- **AI 听不见**：先出前 15 秒样片给人听，方向对了再写全曲
- **钢琴可靠音域 MIDI 28–92**（大约 E1–G#6），太低太高的音会失真
- **弦乐采样文件名的八度比实际低一个**，引擎已统一 +12；新增采样后跑 `check_pitch.py` 核对
- **弦乐快速旋律有拼接感**，弦乐只用来铺长音，旋律交给钢琴和拨弦
- **低频容易太重**：低音、钢琴低八度叠多了会闷，体检看频段占比
- 改了字幕时间，谱子要同步改
