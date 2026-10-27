"""生成胶片颗粒贴图 grain.png（512×512，可平铺），放到项目的 public/。

用法：python make_grain.py <视频项目目录>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')


def main():
    if len(sys.argv) < 2:
        sys.exit('用法：python make_grain.py <视频项目目录>')
    rng = np.random.default_rng(7)
    g = rng.normal(128, 42, (512, 512))
    # 轻微模糊一下，让颗粒不那么尖
    g = (g + np.roll(g, 1, 0) + np.roll(g, 1, 1) + np.roll(np.roll(g, 1, 0), 1, 1)) / 4
    img = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8), 'L')
    dst = Path(sys.argv[1]) / 'public' / 'grain.png'
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst)
    print(f'完成：{dst}')


if __name__ == '__main__':
    main()
