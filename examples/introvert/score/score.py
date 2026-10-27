"""i人真的话少吗 配乐谱子。

120 BPM，4/4，一小节 2 秒，一句字幕（4 秒）= 2 小节；第 0 小节从 0 秒开始（第 0 秒就有声音）。
C 大调，俏皮 + 温暖：合成拨弦做脉冲，钢琴断奏，弦乐长音只在温暖段出现。
时间轴以 `文档/视频文稿.md` 为准。

运行：python score/score.py full   → score/out/full/
"""
import os
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
# 把 {{SKILL_DIR}} 换成 mw-concept-video 的绝对路径，或设环境变量 MW_CONCEPT_VIDEO_DIR
SKILL_DIR = Path(os.environ.get('MW_CONCEPT_VIDEO_DIR', r'{{SKILL_DIR}}'))
sys.path.insert(0, str(SKILL_DIR / 'music'))
sys.stdout.reconfigure(encoding='utf-8')
from scorekit import Score, note_num as N  # noqa: E402

BAR, BEAT = 2.0, 0.5


def at(bar, beat=0.0):
    return bar * BAR + beat * BEAT


CH = {
    'C':  dict(root='C3', tones=['C4', 'E4', 'G4'], pno=['E4', 'G4', 'C5'], pad=['C3', 'G3', 'E4']),
    'Am': dict(root='A2', tones=['A3', 'C4', 'E4'], pno=['C4', 'E4', 'A4'], pad=['A2', 'E3', 'C4']),
    'F':  dict(root='F2', tones=['F3', 'A3', 'C4'], pno=['F4', 'A4', 'C5'], pad=['F2', 'C3', 'A3']),
    'G':  dict(root='G2', tones=['G3', 'B3', 'D4'], pno=['D4', 'G4', 'B4'], pad=['G2', 'D3', 'B3']),
    'Dm': dict(root='D3', tones=['D4', 'F4', 'A4'], pno=['D4', 'F4', 'A4'], pad=['D3', 'A3', 'F4']),
    'Gs': dict(root='G2', tones=['G3', 'C4', 'D4'], pno=['C4', 'D4', 'G4'], pad=['G2', 'D3', 'C4']),
}
CYCLE = ['C', 'Am', 'F', 'G']


def pl(s, bar, beat, name, vel=0.5, dur=0.35):
    s.note('pluck', at(bar, beat), N(name), vel=vel, dur=dur)


def pn(s, bar, beat, name, vel=0.45, dur=0.18):
    s.note('piano', at(bar, beat), N(name), vel=vel, dur=dur)


def groove(s, bar0, chords, dens=2, dv=0.0, piano=True, seed=0):
    """俏皮脉冲：拨弦低音 1、3 拍 + 2 拍后半拍切分；拨弦和弦音在反拍；钢琴断奏和弦在 2、4 拍。
    dens=1 稀疏，2 正常，3 加密（十六分音符拨弦）。"""
    rnd = random.Random(bar0 * 31 + seed)
    for i, ch in enumerate(chords):
        b = bar0 + i
        c = CH[ch]
        pl(s, b, 0, c['root'], 0.62 + dv, 0.4)
        if dens >= 2:
            pl(s, b, 1.5, c['root'], 0.45 + dv, 0.25)
        pl(s, b, 2, c['root'], 0.55 + dv, 0.4)
        offs = [0.5, 1.5, 2.5, 3.5] if dens >= 2 else [1, 3]
        if dens >= 3:
            offs = [k * 0.25 for k in range(16) if k % 4]
        for k, o in enumerate(offs):
            pl(s, b, o, c['tones'][(k + i) % 3], 0.34 + dv + rnd.uniform(-0.04, 0.04), 0.2)
        if piano:
            for beat in (1, 3):
                for n in c['pno']:
                    pn(s, b, beat, n, 0.4 + dv, 0.16)


def pad(s, bar0, chords, vel=0.38, bars_each=1, attack=0.6, release=1.2):
    for i, ch in enumerate(chords):
        t = at(bar0 + i * bars_each)
        notes = [N(n) for n in CH[ch]['pad']]
        s.pad('cello', t, notes[:1], dur=BAR * bars_each, vel=vel, attack=attack, release=release)
        s.pad('viola', t, notes[1:2], dur=BAR * bars_each, vel=vel - 0.04, attack=attack, release=release)
        s.pad('violins', t, notes[2:], dur=BAR * bars_each, vel=vel - 0.06, attack=attack, release=release)


MOTIF = [(0, 'C5'), (0.5, 'E5'), (1, 'G5'), (1.5, 'E5'), (2, 'A5'), (3, 'G5')]   # 开场动机（一小节）


def motif(s, bar, inst='pluck', vel=0.55, up=0):
    for beat, n in MOTIF:
        m = N(n) + up
        if inst == 'pluck':
            s.note('pluck', at(bar, beat), m, vel=vel, dur=0.3)
        else:
            s.note('piano', at(bar, beat), m, vel=vel, dur=0.4)


def build(length):
    s = Score(length=length, seed=20261021)

    # 0–8 秒：钩子。第 0 秒“滴” + 动机，脉冲直接进来
    s.sfx('drip', 0.0, gain=1.0)
    motif(s, 0, vel=0.7)
    pl(s, 0, 0, 'C3', 0.7, 0.5); pl(s, 0, 2, 'C3', 0.6, 0.4)
    for n in ['E4', 'G4', 'C5']:
        pn(s, 0, 0, n, 0.5, 0.3)
    groove(s, 1, ['Am', 'F', 'G'], dens=2)
    motif(s, 2, inst='piano', vel=0.42)

    # 8 秒：“没差别”——唱片刮擦，音乐急停
    s.sfx('scratch', 8.0, gain=0.8)
    # 停半秒，然后几个“尴尬”的拨弦把空白填上
    for beat, n in [(1.5, 'G4'), (2.5, 'E4'), (3.5, 'C4')]:
        pl(s, 4, beat, n, 0.45, 0.25)
    for beat, n in [(0, 'D4'), (1, 'D4'), (2.5, 'G3')]:
        pl(s, 5, beat, n, 0.42, 0.25)
    # 12 秒：“只在上午灵”——一路滑下来的拨弦，然后上扬音推向标题
    for k, n in enumerate(['C6', 'B5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5']):
        pl(s, 6, k * 0.5, n, 0.5 - k * 0.02, 0.25)
    pl(s, 7, 0, 'G2', 0.6, 0.6)
    s.sfx('riser', 16.0, align='end', gain=0.35, length=3.2)

    # 16 秒：标题重击，主题进来
    s.sfx('impact', 16.0, gain=0.6)
    pn(s, 8, 0, 'C2', 0.7, 1.6); pn(s, 8, 0, 'C3', 0.65, 1.6)
    for n in ['E4', 'G4', 'C5']:
        pn(s, 8, 0, n, 0.55, 1.4)
    motif(s, 8, vel=0.62)
    pad(s, 8, ['C'], vel=0.42, bars_each=2, attack=0.15)
    groove(s, 9, ['Am'], dens=2)

    # 20–32 秒：贴标签 / MBTI，加密；24 秒翻牌，28 秒“≈50%”滑稽的下行拨弦
    groove(s, 10, ['F', 'G', 'C', 'Am'], dens=3, dv=0.02)
    s.sfx('flip', 24.0, gain=0.5)
    groove(s, 14, ['F', 'G'], dens=2)
    for k, n in enumerate(['G4', 'F#4', 'F4', 'E4']):
        pl(s, 14, k * 0.5, n, 0.6, 0.3)

    # 32 秒：“到底话少不少？”收一下
    groove(s, 16, ['Am', 'F'], dens=1, dv=-0.08, piano=False)

    # 36–44 秒：录音研究，稳定；40 秒一记重音
    groove(s, 18, ['C', 'G'], dens=2)
    for n in ['C3', 'E4', 'G4', 'C5']:
        pn(s, 20, 0, n, 0.6, 0.5)
    groove(s, 20, ['Am', 'F'], dens=2)

    # 44–52 秒：“演了个遍”，往上推（加密 + 弦乐渐强）
    groove(s, 22, ['C', 'G', 'Am', 'F'], dens=3, dv=0.04)
    pad(s, 22, ['C', 'G', 'Am', 'F'], vel=0.4)
    s.sfx('subdrop', 52.0, gain=0.8)

    # 52–64 秒：核心结论。56 秒撕标签，60 秒主题旋律
    groove(s, 26, ['C', 'Am'], dens=2, dv=0.04)
    s.sfx('tear', 56.0, gain=0.7)
    groove(s, 28, ['F', 'G', 'C', 'Am'], dens=2)
    motif(s, 30, inst='piano', vel=0.55)
    pad(s, 30, ['C', 'Am'], vel=0.36)

    # 64–80 秒：被说中 + 教授铺垫；72 秒钢琴更俏皮
    groove(s, 32, ['F', 'G', 'C', 'Am'], dens=2)
    groove(s, 36, ['F', 'G', 'C', 'G'], dens=2, dv=0.03)
    motif(s, 36, inst='piano', vel=0.5, up=12)

    # 80–88 秒：躲进隔间——关门声，音乐抽空；一双脚抬起来时一个俏皮的单音
    groove(s, 40, ['F'], dens=1, dv=-0.05)
    pl(s, 41, 0, 'G2', 0.45, 0.4)
    s.sfx('click', 82.6, gain=0.9)
    pl(s, 42, 3, 'C6', 0.5, 0.5)
    pl(s, 43, 1, 'G6', 0.4, 0.6)

    # 88 秒：“超乎想象”——重音，音乐回来
    for n in ['C2', 'C3', 'G3', 'E4', 'C5']:
        pn(s, 44, 0, n, 0.62, 0.9)
    s.sfx('impact', 88.0, gain=0.35)
    groove(s, 45, ['Am'], dens=2)

    # 92–108 秒：温暖段，弦乐铺底，钢琴分解
    warm = ['F', 'C', 'Am', 'G', 'F', 'C', 'Dm', 'G']
    groove(s, 46, warm, dens=1, dv=-0.06)
    pad(s, 46, warm, vel=0.42)
    for i, ch in enumerate(warm):
        for k, n in enumerate(CH[ch]['pno'] + CH[ch]['pno'][1:2]):
            pn(s, 46 + i, k, n, 0.38, 0.45)

    # 108–120 秒：噪音实验 + 设问，往顶点推
    groove(s, 54, ['C', 'G', 'Am', 'F', 'Dm', 'G'], dens=3, dv=0.04)
    pad(s, 56, ['Am', 'F', 'Dm', 'G'], vel=0.46)
    s.sfx('riser', 120.0, align='end', gain=0.25, length=3.0)

    # 120 秒：“不是我话少，是这个场子不对”——情绪顶点
    s.sfx('impact', 120.0, gain=0.45)
    groove(s, 60, ['C', 'Am'], dens=3, dv=0.08)
    motif(s, 60, vel=0.66)
    motif(s, 61, inst='piano', vel=0.55, up=12)
    pad(s, 60, ['C', 'Am'], vel=0.5)
    # 124 秒：悬住
    groove(s, 62, ['F', 'Gs'], dens=1, dv=-0.02, piano=False)
    pad(s, 62, ['F', 'Gs'], vel=0.42)

    # 128 秒：“找到那个场子”——解决到主和弦
    for n in ['C2', 'C3', 'G3', 'C4', 'E4', 'G4', 'C5']:
        pn(s, 64, 0, n, 0.5, 6.0)
    pad(s, 64, ['C'], vel=0.4, bars_each=3, attack=1.0, release=2.5)

    # 132 秒：落款，开场动机轻轻重现，余音
    motif(s, 66, vel=0.42)
    s.sfx('drip', 135.0, gain=0.5)
    pl(s, 68, 0, 'C6', 0.38, 1.5)
    return s


GAINS = {'piano': 0.55, 'pluck': 2.6, 'cello': 0.45, 'viola': 0.9, 'violins': 0.85, 'sfx': 0.35}
EQ = [('peak', 500, -3.0, 0.7), ('highshelf', 2500, 1.0), ('peak', 7000, -3.0, 0.7)]
FULL_LENGTH = 141.0

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    length = 36.0 if mode == 'demo' else FULL_LENGTH
    print(build(length).render(HERE / 'out' / mode, stem_gain=GAINS, eq=EQ,
                               reverb_send={'pluck': 0.25, 'piano': 0.25}))
