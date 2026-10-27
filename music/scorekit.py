"""mw-concept-video 编曲引擎：用 CC0 采样（VSCO 2 CE）按代码写的谱子渲染配乐。

首次使用先下载采样：python fetch_samples.py（约 330MB，下载到 music/samples/）

用法（在项目的 score.py 里）：
    import sys; sys.path.insert(0, r'<Skill 目录>/music')
    from scorekit import Score, note_num
    s = Score(length=40)
    s.note('piano', 3.0, note_num('A5'), vel=0.4, dur=2.0)
    s.pad('cello', 18.0, [note_num('F2')], dur=5.0, vel=0.5)
    s.sfx('impact', 18.0)
    s.render('out/demo')   # 写出 stems/*.wav、mix.wav、mix_-14LUFS.wav

乐器：piano / cello / viola / violins（采样），pluck（代码合成的拨弦）。
音效：impact / riser / subdrop / tick / whoosh / drip / scratch / flip / tear / click / crunch / pencil / zip。
"""
from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from scipy import signal

SR = 44100
TOOLBOX = Path(__file__).resolve().parent
SAMPLES = TOOLBOX / 'samples' / 'VSCO-2-CE'
CACHE = TOOLBOX / 'samples' / '_cache'

_NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def note_num(name: str) -> int:
    """'A4' -> 69，'Bb3' / 'F#2' 均可。"""
    m = re.fullmatch(r'([A-G])([#b]?)(-?\d)', name)
    if not m:
        raise ValueError(name)
    pc = _NAMES[m.group(1)] + {'#': 1, 'b': -1, '': 0}[m.group(2)]
    return pc + (int(m.group(3)) + 1) * 12


# ---------------- 采样索引 ----------------

def _parse_piano(fn: str):
    m = re.match(r'Player_dyn(\d)_rr1_(\d{3})\.wav', fn)
    return (21 + 2 * int(m.group(2)), int(m.group(1))) if m else None


def _parse_strings(fn: str):
    # VSCO 文件名的八度比科学音高低一个八度（已用频率检测核对），统一 +12
    m = re.search(r'_([A-G]#?)(\d)_v(\d)', fn)
    if not m:
        return None
    return note_num(m.group(1) + m.group(2)) + 12, int(m.group(3))


INSTRUMENTS = {
    'piano':   dict(dir='Keys/Upright Piano', parse=_parse_piano, pan=0.0, kind='struck'),
    # 目录名大小写以原仓库为准（大提琴、中提琴是 susvib，小提琴是 susVib），Mac / Linux 区分大小写
    'cello':   dict(dir='Strings/Cello Section/susvib', parse=_parse_strings, pan=0.25, kind='sustain'),
    'viola':   dict(dir='Strings/Viola Section/susvib', parse=_parse_strings, pan=0.05, kind='sustain'),
    'violins': dict(dir='Strings/Violin Section/susVib', parse=_parse_strings, pan=-0.3, kind='sustain'),
    'pluck':   dict(dir=None, parse=None, pan=-0.15, kind='synth'),   # Karplus-Strong 拨弦，不用采样
}

_index: dict[str, list[tuple[int, int, Path]]] = {}
_audio: dict[Path, np.ndarray] = {}


def _decode(path: Path) -> np.ndarray:
    """解码成 float32 立体声 44.1k，缓存为 npy。"""
    if path in _audio:
        return _audio[path]
    CACHE.mkdir(parents=True, exist_ok=True)
    key = CACHE / (re.sub(r'[^\w.-]', '_', str(path.relative_to(SAMPLES))) + '.npy')
    if key.exists():
        x = np.load(key)
    else:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '2', '-ar', str(SR),
                              '-f', 'f32le', '-'], capture_output=True, check=True).stdout
        x = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
        # 去掉开头的静音（采样起音前的空白）
        env = np.abs(x).max(1)
        start = max(0, int(np.argmax(env > env.max() * 0.02)) - 64)
        x = x[start:]
        np.save(key, x)
    _audio[path] = x
    return x


def index(inst: str):
    if inst not in _index:
        cfg = INSTRUMENTS[inst]
        rows = []
        for p in sorted((SAMPLES / cfg['dir']).glob('*.wav')):
            r = cfg['parse'](p.name)
            if r:
                rows.append((r[0], r[1], p))
        if not rows:
            raise FileNotFoundError(f'{inst}: 没找到采样 {SAMPLES / cfg["dir"]}，先运行 python fetch_samples.py')
        _index[inst] = rows
    return _index[inst]


_calib: dict[str, float] = {}


def calibration(inst: str) -> float:
    """乐器整体校准系数：让每件乐器采样起音后 1 秒的中位 RMS 落在 -20 dBFS。
    只校准乐器之间，不动同一乐器里强弱档之间的差别。"""
    if INSTRUMENTS[inst]['kind'] == 'synth':
        return 1.0
    if inst not in _calib:
        rms = []
        for _, _, p in index(inst):
            x = _decode(p)[:SR]
            rms.append(np.sqrt((x ** 2).mean()))
        _calib[inst] = float(10 ** (-20 / 20) / (np.median(rms) + 1e-9))
    return _calib[inst]


def _pick(inst: str, midi: int, vel: float):
    rows = index(inst)
    layers = sorted({r[1] for r in rows})
    layer = layers[0] if vel < 0.4 or len(layers) == 1 else layers[-1]
    cand = [r for r in rows if r[1] == layer] or rows
    return min(cand, key=lambda r: (abs(r[0] - midi), r[0] < midi))


# ---------------- 单音渲染 ----------------

def _shift(x: np.ndarray, ratio: float, n_out: int) -> np.ndarray:
    """按 ratio 变调重采样，输出 n_out 个样本（不够则补零）。"""
    pos = np.arange(n_out) * ratio
    valid = pos < len(x) - 1
    out = np.zeros((n_out, 2), np.float32)
    p = pos[valid]
    i = p.astype(int)
    f = (p - i)[:, None]
    out[valid] = x[i] * (1 - f) + x[i + 1] * f
    return out


def _loop_sustain(x: np.ndarray, n_need: int) -> np.ndarray:
    """弦乐长音不够长时，用中段交叉淡化循环续上。"""
    if len(x) >= n_need:
        return x
    a, b = int(len(x) * 0.35), int(len(x) * 0.8)
    seg = x[a:b]
    xf = min(int(0.35 * SR), len(seg) // 3)
    out = x[:b].copy()
    fade_in = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
    while len(out) < n_need:
        tail = out[-xf:] * (1 - fade_in) + seg[:xf] * fade_in
        out = np.concatenate([out[:-xf], tail, seg[xf:]])
    return out


def _pluck(midi: int, dur: float, bright: float = 0.5, seed: int = 0) -> np.ndarray:
    """Karplus-Strong 拨弦：噪声激励 + 带衰减的延迟线，像弦乐拨奏 / 尼龙弦。"""
    f = 440 * 2 ** ((midi - 69) / 12)
    n = int((dur + 0.4) * SR)
    period = SR / f - 0.5          # 两点平均滤波自带半个样本延迟，要扣掉，否则高音偏低
    p = int(period)
    frac = period - p
    rng = np.random.default_rng(seed + midi)
    buf = rng.uniform(-1, 1, p + 2)
    # 激励先做一点低通，越不亮越闷
    for _ in range(int(3 - bright * 2.5)):
        buf = 0.5 * (buf + np.roll(buf, 1))
    decay = 0.996 - 0.004 * max(0, (midi - 60)) / 24
    # 逐周期向量化递推：y[i] 只依赖 i-p-2…i-p，所以一次能算一整段长度 p 的样本
    total = n + p + 2
    y = np.zeros(total, np.float64)
    y[:p + 2] = buf
    i0 = p + 2
    while i0 < total:
        i1 = min(total, i0 + p)
        k = np.arange(i0, i1)
        y[i0:i1] = decay * ((1 - frac) * 0.5 * (y[k - p] + y[k - p - 1]) + frac * 0.5 * (y[k - p - 1] + y[k - p - 2]))
        i0 = i1
    out = y[p + 2:].astype(np.float32)
    env = np.ones(n, np.float32)
    nb = int(dur * SR)
    env[nb:] = np.linspace(1, 0, n - nb) ** 2
    out = out * env
    out /= (np.abs(out).max() + 1e-9)
    return np.stack([out, out], 1) * 0.35


def render_note(inst: str, midi: int, vel: float, dur: float, attack: float | None = None,
                release: float | None = None) -> np.ndarray:
    if INSTRUMENTS[inst]['kind'] == 'synth':
        return _pluck(midi, dur, bright=0.3 + 0.6 * vel) * (0.25 + 0.75 * vel) ** 1.6
    smidi, _, path = _pick(inst, midi, vel)
    ratio = 2 ** ((midi - smidi) / 12)
    kind = INSTRUMENTS[inst]['kind']
    if release is None:
        release = 0.6 if kind == 'struck' else 1.2
    n_body, n_rel = int(dur * SR), int(release * SR)
    src = _decode(path)
    if kind == 'sustain':
        src = _loop_sustain(src, int((n_body + n_rel) * ratio) + 2)
    y = _shift(src, ratio, n_body + n_rel)
    env = np.ones(len(y), np.float32)
    if attack is None:
        attack = 0.005 if kind == 'struck' else 0.35
    na = max(1, int(attack * SR))
    env[:na] = np.linspace(0, 1, na) ** (1 if kind == 'struck' else 2)
    env[n_body:] *= np.linspace(1, 0, len(y) - n_body) ** 2
    gain = (0.25 + 0.75 * vel) ** 1.6 * calibration(inst)
    return y * env[:, None] * gain


# ---------------- 音效合成（原创，不用素材） ----------------

def _noise(n, seed):
    return np.random.default_rng(seed).standard_normal((n, 2)).astype(np.float32)


def _sweep_filter(x, f0, f1, q=0.7):
    """时变带通：分块用 FFT 掩膜，频率从 f0 指数滑到 f1。"""
    n, blk = len(x), 2048
    out = np.zeros_like(x)
    win = np.hanning(blk * 2)[:, None].astype(np.float32)
    freqs = np.fft.rfftfreq(blk * 2, 1 / SR)
    for s in range(0, n, blk):
        seg = x[s:s + blk * 2]
        if len(seg) < blk * 2:
            seg = np.pad(seg, ((0, blk * 2 - len(seg)), (0, 0)))
        fc = f0 * (f1 / f0) ** (s / max(1, n))
        bw = fc / q
        mask = np.exp(-0.5 * ((freqs - fc) / bw) ** 2)[:, None]
        y = np.fft.irfft(np.fft.rfft(seg * win, axis=0) * mask, axis=0).astype(np.float32)
        e = min(n, s + blk * 2)
        out[s:e] += y[:e - s]
    return out


def sfx_impact(seed=1):
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    f = 55 * np.exp(-t * 1.2) + 32
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    nz = _sweep_filter(_noise(n, seed), 1800, 200) * np.exp(-t * 6)[:, None]
    y = np.stack([boom, boom], 1) * 0.9 + nz * 0.5
    return y.astype(np.float32)


def sfx_riser(length=4.0, seed=2):
    n = int(length * SR)
    t = np.arange(n) / SR
    amp = (t / length) ** 2.2
    nz = _sweep_filter(_noise(n, seed), 300, 6000, q=1.2)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (t / length * 2)) / SR) * 0.15
    y = (nz + tone[:, None]) * amp[:, None]
    y[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))[:, None]
    return y.astype(np.float32)


def sfx_subdrop(seed=3):
    n = int(2.0 * SR)
    t = np.arange(n) / SR
    f = 35 + 75 * np.exp(-t * 2.5)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * np.minimum(1, t / 0.01)
    return np.stack([y, y], 1).astype(np.float32)


def sfx_tick(seed=4):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 180)
    return np.stack([y, y], 1).astype(np.float32) * 0.6


def sfx_whoosh(length=1.2, seed=5):
    n = int(length * SR)
    t = np.arange(n) / SR
    amp = np.sin(np.pi * t / length) ** 2
    y = _sweep_filter(_noise(n, seed), 400, 3500, q=1.5) * amp[:, None]
    return y.astype(np.float32)


def sfx_drip(seed=6):
    """水滴：快速上扬的正弦“叮”。"""
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 900 + 1500 * (1 - np.exp(-t * 40))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * np.minimum(1, t / 0.002)
    return np.stack([y, y], 1).astype(np.float32) * 0.8


def sfx_scratch(seed=7):
    """唱片刮擦：带通噪声快速下滑 + 来回两下。"""
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    y = _sweep_filter(_noise(n, seed), 3000, 400, q=2.5)
    amp = np.exp(-((t - 0.12) / 0.07) ** 2) + 0.7 * np.exp(-((t - 0.32) / 0.08) ** 2)
    return (y * amp[:, None]).astype(np.float32) * 1.6


def sfx_flip(seed=8):
    """翻牌：一串短促的咔哒声。"""
    n = int(0.9 * SR)
    y = np.zeros((n, 2), np.float32)
    rng = np.random.default_rng(seed)
    for k in range(14):
        s = int((k * 0.06 + rng.uniform(0, 0.015)) * SR)
        c = sfx_tick()[: int(0.03 * SR)] * (0.5 + 0.5 * rng.uniform())
        y[s:s + len(c)] += c[: n - s]
    return y


def sfx_tear(seed=9):
    """撕纸：粗糙的高频噪声，振幅抖动。"""
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    nz = _sweep_filter(_noise(n, seed), 2500, 1800, q=0.8)
    jitter = 0.6 + 0.4 * np.abs(np.sin(t * 2 * np.pi * 37)) * np.random.default_rng(seed).uniform(0.5, 1, n)
    amp = np.minimum(1, t / 0.02) * np.exp(-t * 3)
    return (nz * (jitter * amp)[:, None]).astype(np.float32) * 1.4


def sfx_click(seed=10):
    """门锁“咔”：两声低沉的短促敲击。"""
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for t0, f0 in ((0.0, 180), (0.07, 120)):
        tt = np.clip(t - t0, 0, None)
        y += np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * 60) * (t >= t0)
    nz = _noise(n, seed)[:, 0] * np.exp(-t * 90) * 0.3
    y = y + nz
    return np.stack([y, y], 1).astype(np.float32) * 0.9


def sfx_crunch(seed=31):
    """咬一口脆的东西：一记闷的“咔”加三四下细碎的脆响。"""
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    y = np.zeros((n, 2), np.float32)
    thump = np.sin(2 * np.pi * 140 * t) * np.exp(-t * 45)
    y += np.stack([thump, thump], 1) * 0.6
    for k, t0 in enumerate([0.0, 0.035, 0.07, 0.12]):
        s = int(t0 * SR)
        m = int(0.05 * SR)
        nz = _sweep_filter(_noise(m, seed + k), 3800 - k * 500, 2200, q=1.2)
        env = np.exp(-np.arange(m) / SR * (90 - k * 10))[:, None] * (1 - k * 0.18) * rng.uniform(0.8, 1)
        y[s:s + m] += nz * env * 2.2
    return y


def sfx_pencil(length=2.2, seed=32):
    """铅笔沙沙：高频噪声，按笔画一下一下起伏。"""
    n = int(length * SR)
    t = np.arange(n) / SR
    nz = _sweep_filter(_noise(n, seed), 4500, 3500, q=1.0)
    strokes = np.abs(np.sin(2 * np.pi * 3.2 * t + 0.6 * np.sin(2 * np.pi * 0.7 * t))) ** 3
    env = strokes * np.minimum(1, t / 0.1) * np.minimum(1, (length - t) / 0.2)
    return (nz * env[:, None] * 0.6).astype(np.float32)


def sfx_zip(length=1.4, seed=33):
    """拉链：越拉越快的一串细小咔哒。"""
    n = int(length * SR)
    y = np.zeros((n, 2), np.float32)
    tt, k = 0.0, 0
    while tt < length - 0.02:
        s = int(tt * SR)
        m = min(int(0.012 * SR), n - s)
        nz = _noise(m, seed + k) * np.exp(-np.arange(m) / SR * 400)[:, None]
        y[s:s + m] += nz * (0.5 + 0.5 * tt / length)
        tt += 0.03 - 0.018 * tt / length
        k += 1
    return _sweep_filter(y, 3000, 5000, q=0.8) * 1.6


SFX = dict(impact=sfx_impact, riser=sfx_riser, subdrop=sfx_subdrop, tick=sfx_tick, whoosh=sfx_whoosh,
           drip=sfx_drip, scratch=sfx_scratch, flip=sfx_flip, tear=sfx_tear, click=sfx_click,
           crunch=sfx_crunch, pencil=sfx_pencil, zip=sfx_zip)


# ---------------- 混响与母带 ----------------

def reverb_ir(rt60=2.6, predelay=0.02, seed=7):
    n = int(rt60 * SR)
    t = np.arange(n) / SR
    ir = _noise(n, seed) * np.exp(-6.9 * t / rt60)[:, None]
    b, a = signal.butter(1, 5000 / (SR / 2))
    ir = signal.lfilter(b, a, ir, axis=0)
    ir = np.concatenate([np.zeros((int(predelay * SR), 2)), ir]).astype(np.float32)
    return ir / np.sqrt((ir ** 2).sum(0, keepdims=True))


def _pan(x, p):
    l, r = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4)
    return x * np.array([l, r], np.float32) * np.sqrt(2)


def _write_wav(path: Path, x: np.ndarray):
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_s24le', str(path)], input=x.astype(np.float32).tobytes(), check=True)


def measure_lufs(path: Path) -> float:
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af', 'ebur128', '-f', 'null', '-'],
                         capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', out[out.rindex('Summary:'):]).group(1))


def _biquad(kind: str, f0: float, gain_db: float, q: float = 0.7):
    """RBJ 均衡器系数：kind = 'peak' / 'highshelf'。"""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w), np.sin(w)
    alpha = sw / (2 * q)
    if kind == 'peak':
        b = [1 + alpha * A, -2 * cw, 1 - alpha * A]
        a = [1 + alpha / A, -2 * cw, 1 - alpha / A]
    else:
        sq = 2 * np.sqrt(A) * alpha
        b = [A * ((A + 1) + (A - 1) * cw + sq), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - sq)]
        a = [(A + 1) - (A - 1) * cw + sq, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - sq]
    return np.array(b) / a[0], np.array(a) / a[0]


def limiter(x: np.ndarray, ceiling_db: float = -1.5, release: float = 0.15) -> np.ndarray:
    """前视峰值限幅：5ms 前视，150ms 释放，只在超过天花板时压。"""
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    ceil = 10 ** (ceiling_db / 20) * 0.97  # 留余量给采样间峰值
    look = int(0.005 * SR)
    pk = maximum_filter1d(np.abs(x).max(1), size=look * 2 + 1)
    g = np.minimum(1.0, ceil / (pk + 1e-9))
    g = -maximum_filter1d(-g, size=int(release * SR))      # 压下去后保持一段
    g = uniform_filter1d(g, size=look * 2 + 1)              # 平滑，防止咔哒
    return (x * g[:, None]).astype(np.float32)


def master(x: np.ndarray, tmp: Path, dst: Path, target: float, eq=None, ceiling_db=-1.5) -> dict:
    """母带：均衡 → 线性增益到目标响度 → 限幅。迭代两次让响度落准，动态不被压缩器改形。"""
    for kind, f0, g, *q in (eq or []):
        b, a = _biquad(kind, f0, g, *(q or [0.7]))
        x = signal.lfilter(b, a, x, axis=0).astype(np.float32)
    for _ in range(4):
        y = limiter(x, ceiling_db)          # 每一轮都先限幅再测，避免第一轮就达标时跳过限幅导致爆音
        _write_wav(tmp, y)
        cur = measure_lufs(tmp)
        if abs(cur - target) < 0.3:
            break
        x = x * 10 ** ((target - cur) / 20)
    _write_wav(dst, y)
    return dict(lufs=measure_lufs(dst), target=target, limiter_max_reduction_db=round(
        float(20 * np.log10(np.abs(x).max() / (np.abs(y).max() + 1e-9))), 1))


@dataclass
class Score:
    length: float
    seed: int = 0
    events: list = field(default_factory=list)

    def note(self, inst, t, midi, vel=0.5, dur=1.0, stem=None, **kw):
        self.events.append(dict(kind='note', inst=inst, t=t, midi=midi, vel=vel, dur=dur,
                                stem=stem or inst, kw=kw))

    def pad(self, inst, t, midis, dur, vel=0.45, attack=0.8, release=1.5, stem=None):
        for m in midis:
            self.note(inst, t, m, vel=vel, dur=dur, stem=stem, attack=attack, release=release)

    def sfx(self, name, t, gain=1.0, align='start', **kw):
        """align='end' 表示让音效在 t 时刻结束（上扬音对准重击用）。"""
        self.events.append(dict(kind='sfx', name=name, t=t, gain=gain, align=align, kw=kw, stem='sfx'))

    def render(self, out_dir, stem_gain=None, reverb_send=None, target_lufs=-14.0, eq=None):
        """eq 例：[('peak', 250, -2.0, 0.9), ('highshelf', 3000, 4.0)]"""
        out_dir = Path(out_dir)
        n = int(self.length * SR)
        stems: dict[str, np.ndarray] = {}
        rng = np.random.default_rng(self.seed)
        for e in self.events:
            if e['kind'] == 'note':
                y = render_note(e['inst'], e['midi'], e['vel'], e['dur'], **e['kw'])
                y = _pan(y, INSTRUMENTS[e['inst']]['pan'])
                t = e['t'] + (rng.normal(0, 0.006) if INSTRUMENTS[e['inst']]['kind'] == 'struck' else 0)
            else:
                y = SFX[e['name']](**e['kw']) * e['gain']
                t = e['t'] - (len(y) / SR if e['align'] == 'end' else 0)
            s = max(0, int(t * SR))
            buf = stems.setdefault(e['stem'], np.zeros((n, 2), np.float32))
            m = min(len(y), n - s)
            if m > 0:
                buf[s:s + m] += y[:m]
        stem_gain = stem_gain or {}
        reverb_send = {'piano': 0.35, 'cello': 0.4, 'viola': 0.45, 'violins': 0.5, 'sfx': 0.25,
                       **(reverb_send or {})}
        ir = reverb_ir()
        mix = np.zeros((n, 2), np.float32)
        for name, x in stems.items():
            x = x * stem_gain.get(name, 1.0)
            wet = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:n] for c in range(2)], 1)
            y = x + wet * reverb_send.get(name, 0.3)
            _write_wav(out_dir / 'stems' / f'{name}.wav', y)
            mix += y
        # 末尾 1.5 秒淡出防止截断
        f = int(1.5 * SR)
        mix[-f:] *= np.linspace(1, 0, f)[:, None] ** 2
        peak = float(np.abs(mix).max())
        _write_wav(out_dir / 'mix.wav', mix / peak * 0.89 if peak > 0 else mix)
        final = out_dir / f'mix_{int(target_lufs)}LUFS.wav'
        loud = master(mix, out_dir / '_tmp.wav', final, target_lufs, eq=eq)
        (out_dir / '_tmp.wav').unlink(missing_ok=True)
        info = dict(length=self.length, events=len(self.events), stems=list(stems), peak_before_norm=peak,
                    master=loud, calibration={k: round(v, 3) for k, v in _calib.items()})
        (out_dir / 'render_info.json').write_text(json.dumps(info, ensure_ascii=False, indent=2), 'utf-8')
        return final
