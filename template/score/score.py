"""配乐谱子（示例：配合模板的 16 秒演示开场）。

120 BPM，4/4，一小节 2 秒，一句字幕（4 秒）= 2 小节；第 0 小节从 0 秒开始，第 0 秒就有声音。
时间轴以 文档/视频文稿.md 和 src/subs.ts 为准；改字幕时间要同步改这里。

运行：python score/score.py demo   → score/out/demo/（前 15–20 秒样片）
      python score/score.py full   → score/out/full/
成品：out/<模式>/mix_-14LUFS.wav，复制到 public/music.wav
体检：python <Skill>/music/check_audio.py score/out/full 0-4 4-12 --hit 1.5 8 12
"""
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
# 新建项目时把 {{SKILL_DIR}} 换成 mw-concept-video 的绝对路径；也可以用环境变量 MW_CONCEPT_VIDEO_DIR
SKILL_DIR = Path(os.environ.get('MW_CONCEPT_VIDEO_DIR', r'{{SKILL_DIR}}'))
sys.path.insert(0, str(SKILL_DIR / 'music'))
sys.stdout.reconfigure(encoding='utf-8')
from scorekit import Score, note_num as N  # noqa: E402

BAR, BEAT = 2.0, 0.5


def at(bar, beat=0.0):
    return bar * BAR + beat * BEAT


# 和弦：bass 低音，pno 钢琴三和弦，pad 弦乐铺底（大提琴 / 中提琴 / 小提琴各一个音）
CH = {
    'D':    dict(bass='D2', pno=['F#4', 'A4', 'D5'], pad=['D3', 'A3', 'F#4']),
    'Bm':   dict(bass='B1', pno=['F#4', 'B4', 'D5'], pad=['B2', 'F#3', 'D4']),
    'G':    dict(bass='G1', pno=['G4', 'B4', 'D5'], pad=['G2', 'D3', 'B3']),
    'Asus': dict(bass='A1', pno=['E4', 'A4', 'D5'], pad=['A2', 'E3', 'D4']),
}
MOTIF = [(0, 'A5', 1.6), (2, 'F#5', 0.5), (2.5, 'A5', 0.5), (3, 'B5', 1.0)]          # 开场动机，结尾重现
THEME = [(0, 'D5', 0.5), (0.5, 'F#5', 0.5), (1, 'A5', 1.0), (2, 'G5', 0.5), (2.5, 'F#5', 0.5), (3, 'E5', 1.0)]


def pn(s, bar, beat, name, vel=0.45, dur=0.5):
    s.note('piano', at(bar, beat), N(name), vel=vel, dur=dur)


def phrase(s, bar, notes, vel=0.5):
    for beat, n, d in notes:
        pn(s, bar, beat, n, vel, d)


def chord(s, bar, name, vel=0.4, dur=1.6, bass=True):
    c = CH[name]
    if bass:
        pn(s, bar, 0, c['bass'], vel + 0.08, dur + 0.4)
    for n in c['pno']:
        pn(s, bar, 0, n, vel, dur)


def pad(s, bar, names, vel=0.36, attack=0.8):
    for i, name in enumerate(names):
        a, b, c = (N(n) for n in CH[name]['pad'])
        t = at(bar + i)
        s.pad('cello', t, [a], dur=BAR, vel=vel, attack=attack)
        s.pad('viola', t, [b], dur=BAR, vel=vel - 0.04, attack=attack)
        s.pad('violins', t, [c], dur=BAR, vel=vel - 0.06, attack=attack)


def build(length):
    s = Score(length=length, seed=1)
    # 0 秒：第 0 秒就有声音（单音 + 低音）；1.5 秒画面一分为三，配一个嗖声
    phrase(s, 0, MOTIF, vel=0.6)
    pn(s, 0, 0, 'D2', 0.42, 3.0)
    s.sfx('whoosh', 1.5, gain=0.7, length=0.9)
    for beat, n in [(0, 'E5'), (1, 'D5'), (2, 'C#5'), (3, 'A4')]:
        pn(s, 1, beat, n, 0.34, 0.6)
    # 4–8 秒：逐个入场，拨弦一个个进来
    for k in range(12):
        s.note('pluck', 4 + k * 0.27, N(['D4', 'F#4', 'A4', 'D5'][k % 4]), vel=0.42 + k * 0.01, dur=0.3)
    chord(s, 2, 'D', vel=0.3)
    chord(s, 3, 'Bm', vel=0.3)
    # 8 秒：数字砸出，一记重音；和弦悬着不解决，上扬音对准 12 秒标题
    s.sfx('impact', 8.0, gain=0.4)
    chord(s, 4, 'G', vel=0.5, dur=3.0)
    pad(s, 4, ['G', 'Asus'], vel=0.36, attack=0.3)
    s.sfx('riser', 12.0, align='end', gain=0.4, length=3.4)
    # 12 秒：标题重击，主题进来
    s.sfx('impact', 12.0, gain=0.65)
    pn(s, 6, 0, 'D2', 0.72, 3.0)
    chord(s, 6, 'D', vel=0.55, dur=2.4, bass=False)
    phrase(s, 6, THEME, vel=0.58)
    pad(s, 6, ['D', 'Bm'], vel=0.44, attack=0.12)
    return s


GAINS = {'piano': 0.7, 'pluck': 2.2, 'cello': 0.5, 'viola': 0.85, 'violins': 0.8, 'sfx': 0.4}
EQ = [('peak', 110, -5.0, 0.8), ('peak', 300, -3.0, 0.9), ('highshelf', 2500, 4.0)]
FULL_LENGTH = 16.0

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    length = min(20.0, FULL_LENGTH) if mode == 'demo' else FULL_LENGTH
    print(build(length).render(HERE / 'out' / mode, stem_gain=GAINS, eq=EQ,
                               reverb_send={'pluck': 0.25, 'piano': 0.3}))
