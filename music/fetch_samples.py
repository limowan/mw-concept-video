"""下载配乐用的乐器采样（VSCO 2 Community Edition，CC0）。

只下载引擎用到的立式钢琴、大提琴群、中提琴群、小提琴群，共 121 个 wav，约 330MB。
已经下载过的文件会跳过，中断后重跑即可续传。

用法：python fetch_samples.py
来源：https://github.com/sgossner/VSCO-2-CE （Versilian Studios，CC0 1.0）
"""
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
HERE = Path(__file__).resolve().parent
DEST = HERE / 'samples' / 'VSCO-2-CE'
BASE = 'https://raw.githubusercontent.com/sgossner/VSCO-2-CE/master/'


def fetch(rel: str, dst: Path):
    if dst.exists() and dst.stat().st_size > 0:
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    url = BASE + urllib.parse.quote(rel)
    tmp = dst.with_suffix(dst.suffix + '.part')
    with urllib.request.urlopen(url, timeout=60) as r, open(tmp, 'wb') as f:
        while chunk := r.read(1 << 16):
            f.write(chunk)
    tmp.replace(dst)
    return True


def main():
    files = [ln.strip() for ln in (HERE / 'samples-list.txt').read_text('utf-8').splitlines() if ln.strip()]
    fetch('LICENSE', DEST / 'LICENSE.txt')
    new = 0
    for i, rel in enumerate(files, 1):
        try:
            if fetch(rel, DEST / rel):
                new += 1
        except Exception as e:  # 网络问题：提示后继续，重跑会补齐
            print(f'  下载失败：{rel}（{e}）')
        if i % 10 == 0 or i == len(files):
            print(f'{i}/{len(files)}')
    wavs = list(DEST.rglob('*.wav'))
    print(f'完成：新下载 {new} 个，本地共 {len(wavs)} 个 wav（应为 121 个）→ {DEST}')
    if len(wavs) < 121:
        sys.exit('有文件没下载成功，重跑一次即可续传')


if __name__ == '__main__':
    main()
