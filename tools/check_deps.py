"""检查做片需要的环境：Node.js、npm、ffmpeg、Python 包、乐器采样。

用法：python check_deps.py
"""
import importlib.util
import shutil
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
SKILL = Path(__file__).resolve().parents[1]
ok = True


def line(good: bool, name: str, detail: str, fix: str = ''):
    global ok
    ok &= good
    print(f"{'✓' if good else '✗'} {name}：{detail}" + ('' if good or not fix else f'\n    → {fix}'))


def version(cmd: list[str]) -> str:
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=20, shell=sys.platform == 'win32')
        return (out.stdout or out.stderr).strip().splitlines()[0]
    except Exception:
        return ''


node = version(['node', '-v'])
major = int(node.lstrip('v').split('.')[0]) if node.startswith('v') else 0
line(major >= 18, 'Node.js', node or '没找到', '安装 Node.js 18 以上：https://nodejs.org')
line(bool(shutil.which('npm') or shutil.which('npm.cmd')), 'npm', '已安装' if shutil.which('npm') or shutil.which('npm.cmd') else '没找到')
ff = version(['ffmpeg', '-version'])
line(bool(ff), 'ffmpeg', ff[:40] or '没找到', '安装 ffmpeg 并加入 PATH：https://ffmpeg.org/download.html')
line(sys.version_info >= (3, 10), 'Python', sys.version.split()[0], '需要 Python 3.10 以上')
for mod, pip in [('numpy', 'numpy'), ('scipy', 'scipy'), ('PIL', 'pillow')]:
    found = importlib.util.find_spec(mod) is not None
    line(found, f'Python 包 {pip}', '已安装' if found else '没装', f'pip install {pip}')
wavs = list((SKILL / 'music' / 'samples' / 'VSCO-2-CE').rglob('*.wav'))
line(len(wavs) >= 121, '乐器采样', f'{len(wavs)}/121 个', f'python "{SKILL / "music" / "fetch_samples.py"}"')

print('\n环境齐了，可以开始做片。' if ok else '\n按上面的提示补齐后再开始。')
sys.exit(0 if ok else 1)
