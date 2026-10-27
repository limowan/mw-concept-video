"""下载思源黑体、思源宋体（Noto Sans SC / Noto Serif SC 可变字体，SIL OFL 1.1）到项目的 public/fonts/。

用法：python fetch_fonts.py <视频项目目录>
来源：https://github.com/google/fonts （ofl/notosanssc、ofl/notoserifsc）
"""
import sys
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
FONTS = {
    'NotoSansSC.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    'NotoSerifSC.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
}


def main():
    if len(sys.argv) < 2:
        sys.exit('用法：python fetch_fonts.py <视频项目目录>')
    dest = Path(sys.argv[1]) / 'public' / 'fonts'
    dest.mkdir(parents=True, exist_ok=True)
    for name, url in FONTS.items():
        dst = dest / name
        if dst.exists() and dst.stat().st_size > 1_000_000:
            print(f'已存在：{dst}')
            continue
        print(f'下载 {name}（约 20MB）……')
        tmp = dst.with_suffix('.part')
        with urllib.request.urlopen(url, timeout=120) as r, open(tmp, 'wb') as f:
            while chunk := r.read(1 << 16):
                f.write(chunk)
        tmp.replace(dst)
        print(f'完成：{dst}')


if __name__ == '__main__':
    main()
