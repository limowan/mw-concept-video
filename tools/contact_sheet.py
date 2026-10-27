"""抽帧联系表：按秒数各渲染一帧（Silent 合成，不带音频），拼成一张两列的图，左上角标秒数。

用法（在视频项目根目录运行，先 npx remotion bundle src/index.ts --out-dir build）：
  python <Skill>/tools/contact_sheet.py 名字 秒1 秒2 ...     → qc/名字.png
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')
FPS = 30
TILE = (640, 360)


def main():
    if len(sys.argv) < 3:
        sys.exit('用法：python contact_sheet.py 名字 秒1 秒2 ...')
    name, secs = sys.argv[1], [float(s) for s in sys.argv[2:]]
    out = Path('qc') / f'{name}.png'
    out.parent.mkdir(exist_ok=True)
    tiles = []
    with tempfile.TemporaryDirectory() as tmp:
        for k, s in enumerate(secs):
            png = Path(tmp) / f'{k:03d}.png'
            subprocess.run(['npx', 'remotion', 'still', 'build', 'Silent', str(png), f'--frame={round(s * FPS)}',
                            '--log=error'], check=True, shell=sys.platform == 'win32')
            im = Image.open(png).convert('RGB').resize(TILE, Image.LANCZOS)
            d = ImageDraw.Draw(im)
            d.rectangle([0, 0, 74, 26], fill=(0, 0, 0))
            d.text((8, 6), f'{s:g}s', fill=(255, 220, 0))
            tiles.append(im)
    cols = 2
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * TILE[0] + (cols - 1) * 4, rows * TILE[1] + (rows - 1) * 4), (90, 90, 90))
    for k, im in enumerate(tiles):
        sheet.paste(im, ((k % cols) * (TILE[0] + 4), (k // cols) * (TILE[1] + 4)))
    sheet.save(out)
    print(out)


if __name__ == '__main__':
    main()
