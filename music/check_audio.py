"""配乐体检：响度、真峰值、各分轨音量、频段平衡、咔哒声、指定时间点的能量突增。

用法：python check_audio.py <渲染输出目录> [段落 起-止 ...] [--hit 秒 ...]
例：  python check_audio.py out/demo 0-18 18-23 23-35 --hit 18
"""
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 44100
sys.stdout.reconfigure(encoding='utf-8')


def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)


def db(x):
    return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)


def main():
    args = sys.argv[1:]
    d = Path(args[0])
    hits = [float(a) for a in args[args.index('--hit') + 1:]] if '--hit' in args else []
    segs = [tuple(map(float, a.split('-'))) for a in args[1:] if re.fullmatch(r'[\d.]+-[\d.]+', a)]
    final = next(d.glob('mix_*LUFS.wav'))
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(final), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    summ = out[out.rindex('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1)
    lra = re.search(r'LRA:\s+(-?[\d.]+) LU', summ).group(1)
    tp = re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1)
    print(f'成品 {final.name}：整体响度 {i} LUFS，动态范围 {lra} LU，真峰值 {tp} dBFS')

    m = load(final).mean(1)
    n = len(m) // SR
    print('每秒音量(dB)：' + ' '.join(f'{s}:{db(m[s * SR:(s + 1) * SR]):.0f}' for s in range(n)))
    segs = segs or [(0, n)]
    print('分轨音量(dB，未归一化)：')
    for st in sorted((d / 'stems').glob('*.wav')):
        x = load(st).mean(1)
        cols = '  '.join(f'{a:g}-{b:g}秒 {db(x[int(a * SR):int(b * SR)]):6.1f}' for a, b in segs)
        print(f'  {st.stem:8s} {cols}  峰值 {20 * np.log10(np.abs(x).max() + 1e-9):6.1f}')
    for h in hits:
        e = np.array([db(m[k:k + 441]) for k in range(int((h - 1) * SR), int((h + 1) * SR), 441)])
        j = int(np.argmax(np.diff(e)))
        print(f'{h}秒附近能量突增点 ≈ {h - 1 + (j + 1) * 0.01:.2f} 秒，增幅 {np.diff(e)[j]:.1f} dB')
    dm = np.abs(np.diff(m))
    clicks = np.where(dm > max(np.percentile(dm, 99.99) * 3, 0.05))[0]
    print(f'疑似咔哒点 {len(clicks)} 个', (clicks[:10] / SR).round(3) if len(clicks) else '')
    S = np.abs(np.fft.rfft(m)) ** 2
    f = np.fft.rfftfreq(len(m), 1 / SR)
    tot = S.sum()
    bands = [(20, 80), (80, 250), (250, 1000), (1000, 4000), (4000, 16000)]
    print('频段能量占比：' + ' '.join(f'{a}-{b}Hz {S[(f >= a) & (f < b)].sum() / tot * 100:.0f}%' for a, b in bands))


if __name__ == '__main__':
    main()
