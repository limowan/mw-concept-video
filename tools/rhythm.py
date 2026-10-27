"""画面节奏测量：多久出现一次明显的画面变化（换场景、推镜头、大元素入场）。

用法：
  python rhythm.py 视频1.mp4 [视频2.mp4 ...]            # 整片统计，可多支对比
  python rhythm.py 成片.mp4 --seg 23-58 --seg 58-88       # 另外按段统计（例如只看证据段）
  python rhythm.py 成片.mp4 --subs src/subs.ts            # 加测字幕切换对齐率

判定方法（粗略，数字看量级）：每秒抽 10 帧缩到 160×90 灰度。
- 大变化：比较相隔 1 秒的两帧，差异超过全片中位数的 3 倍且绝对值 > 6，1.5 秒内只记一次
- 字幕对齐：换字幕前 0.3 秒和后 0.7 秒的两帧差异 > 1.5 算画面跟着变了（不看底部字幕带）
- 静止段：相隔 0.5 秒的两帧差异 < 0.4 连续超过 2 秒（不看底部字幕带；胶片颗粒底噪约 0.2）
  元素很小的动作（如一双脚抬起）可能测不到，结合联系表判断

实测参考：峰终定律（反面教材）每 29.4 秒一次大变化、对齐率 35%、静止段 16 处；
i 人每 5.4 秒、94%、13 处；实践论每 4.9 秒、100%、0 处。
目标：证据段平均间隔 ≤ 6 秒（超过 8 秒返工）；对齐率 ≥ 90%；静止段 0 处。转折段可以刻意放慢。
"""
import re
import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')
W, H, FPS = 160, 90, 10
BAND = int(H * 0.78)  # 底部字幕带以上
ALIGN_THR, STILL_THR, STILL_SEC = 1.5, 0.4, 2.0


def frames(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vf', f'fps={FPS},scale={W}:{H},format=gray',
                          '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)


def events(v):
    big = np.abs(v[FPS:] - v[:-FPS]).mean((1, 2))
    hit = np.where((big > np.percentile(big, 50) * 3) & (big > 6))[0] / FPS + 1.0
    out, last = [], -9.0
    for t in hit:
        if t - last > 1.5:
            out.append(round(float(t), 1))
            last = t
    return out


def sub_starts(path):
    """从 subs.ts 读每句字幕的开始秒数：形如 [12, '字幕…'] 的行。"""
    text = Path(path).read_text(encoding='utf-8')
    return [float(m) for m in re.findall(r"^\s*\[(\d+(?:\.\d+)?),\s*'", text, re.M)]


def alignment(v, starts):
    """换字幕的那一刻，画面有没有跟着变。返回 (跟上的, 没跟上的时间点)。"""
    top = v[:, :BAND]
    ok, miss = 0, []
    for t in starts:
        a, b = int(round((t - 0.3) * FPS)), int(round((t + 0.7) * FPS))
        if a < 0 or b >= len(top):
            continue  # 第 0 秒那句前面没有画面可比，开头另用 --seg 0-3 和抽帧看
        if np.abs(top[b] - top[a]).mean() > ALIGN_THR:
            ok += 1
        else:
            miss.append(t)
    return ok, miss


def stills(v):
    """画面基本不动、连续超过 STILL_SEC 秒的段落。"""
    top = v[:, :BAND]
    k = FPS // 2
    quiet = list(np.abs(top[k:] - top[:-k]).mean((1, 2)) < STILL_THR) + [False]
    out, s = [], None
    for i, q in enumerate(quiet):
        if q and s is None:
            s = i
        elif not q and s is not None:
            if (i + k - s) / FPS >= STILL_SEC:
                out.append((s / FPS, (i + k) / FPS))
            s = None
    return out


def report(name, dur, ev, motion, still, a=None, b=None):
    a = 0 if a is None else a
    b = dur if b is None else b
    e = [t for t in ev if a <= t < b]
    span = b - a
    marks = [a] + e + [b]
    gap_i = int(np.argmax(np.diff(marks)))
    gap = marks[gap_i + 1] - marks[gap_i]
    label = name if (a, b) == (0, dur) else f'  {a:g}–{b:g} 秒'
    line = f'{label}：{len(e)} 次大变化，平均每 {span / max(1, len(e)):.1f} 秒一次；' \
           f'最长空档 {gap:.1f} 秒（{marks[gap_i]:g}–{marks[gap_i + 1]:g}）'
    if motion is not None:
        line += f'；平均运动量 {motion:.2f}，近乎静止帧 {still:.0f}%'
    print(line)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('videos', nargs='+')
    ap.add_argument('--seg', action='append', default=[], help='段落，如 23-58')
    ap.add_argument('--subs', help='字幕时间轴文件（如 src/subs.ts），用来测字幕切换对齐率')
    args = ap.parse_args()
    missing = [p for p in args.videos + ([args.subs] if args.subs else []) if not Path(p).is_file()]
    if missing:
        sys.exit('找不到文件：' + '，'.join(missing))
    for p in args.videos:
        v = frames(p)
        dur = len(v) / FPS
        d = np.abs(np.diff(v, axis=0)).mean((1, 2))
        ev = events(v)
        report(Path(p).name, dur, ev, float(d.mean()), float((d < 0.15).mean() * 100))
        for s in args.seg:
            a, b = map(float, s.split('-'))
            report(None, dur, ev, None, None, a, b)
        print('  变化时间点：' + ' '.join(f'{t:g}' for t in ev))
        if args.subs:
            ok, miss = alignment(v, sub_starts(args.subs))
            n = ok + len(miss)
            print(f'  字幕切换对齐率：{ok}/{n}（{ok / max(1, n) * 100:.0f}%，目标 ≥ 90%）' +
                  (f'；没跟着变：{" ".join(f"{t:g}" for t in miss)}' if miss else ''))
        st = stills(v)
        print(f'  静止段（> {STILL_SEC:g} 秒）：{len(st)} 处，共 {sum(b - a for a, b in st):.1f} 秒（目标 0 处）' +
              (('；' + ' '.join(f'{a:.1f}–{b:.1f}' for a, b in st)) if st else ''))


if __name__ == '__main__':
    main()
