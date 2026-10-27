"""逐个检测采样的真实音高，和 scorekit 索引里的音高对比。新增乐器后跑一次。"""
import math
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import scorekit as sk

sys.stdout.reconfigure(encoding='utf-8')


def detect(x):
    """自相关估计基频（比频谱峰值更不容易认错八度）。"""
    x = x[int(0.25 * sk.SR):int(1.25 * sk.SR)].mean(1)
    x = x - x.mean()
    n = 1 << int(np.ceil(np.log2(len(x) * 2)))
    X = np.fft.rfft(x, n)
    ac = np.fft.irfft(X * np.conj(X))[:len(x)]
    ac /= ac[0] + 1e-12
    lo, hi = int(sk.SR / 4600), int(sk.SR / 24)
    seg = ac[lo:hi]
    # 取第一个超过全局峰值 0.85 倍的峰，避免认成低八度
    thr = seg.max() * 0.85
    peaks = [i for i in range(1, len(seg) - 1) if seg[i] > thr and seg[i] >= seg[i - 1] and seg[i] >= seg[i + 1]]
    lag = lo + (peaks[0] if peaks else int(np.argmax(seg)))
    return sk.SR / lag


bad = 0
for inst in sk.INSTRUMENTS:
    rows = sk.index(inst)
    for midi, layer, path in rows:
        f = detect(sk._decode(path))
        got = 69 + 12 * math.log2(f / 440)
        diff = got - midi
        ok = abs(diff) < 0.6
        if not ok:
            bad += 1
            print(f'不符 {inst:8s} {path.name:34s} 索引={midi} 检测={got:.1f} 差={diff:+.1f}')
    print(f'{inst}: {len(rows)} 个采样，音域 {min(r[0] for r in rows)}–{max(r[0] for r in rows)}')
print('不符合计', bad)
