#!/usr/bin/env bash
# 检查点：确认一支片子的每个阶段都做完、产物都在。
# 每完成一个阶段，在视频项目根目录执行：echo "阶段名_DONE" >> .check_status
# 全部做完后运行：bash <Skill>/tools/check_completion.sh <视频项目目录>
# 脚本检查完会删除 .check_status。
set -u
dir="${1:-.}"
status="$dir/.check_status"
stages=(选题 调研 视频文稿 样片 全片 质检 成片)
miss=0

echo "== 阶段标记 =="
for s in "${stages[@]}"; do
  if [ -f "$status" ] && grep -q "^${s}_DONE$" "$status"; then
    echo "✓ $s"
  else
    echo "✗ $s 没有完成标记"; miss=$((miss + 1))
  fi
done

echo "== 产物 =="
check() { if [ -e "$1" ]; then echo "✓ $2"; else echo "✗ $2 缺失：$1"; miss=$((miss + 1)); fi; }
check "$dir/文档/调研.md" "调研"
check "$dir/文档/视频文稿.md" "视频文稿"
check "$dir/src/subs.ts" "字幕时间轴"
check "$dir/score/score.py" "配乐谱子"
ls "$dir"/产物/*.mp4 >/dev/null 2>&1 && echo "✓ 成片" || { echo "✗ 成片缺失：$dir/产物/*.mp4"; miss=$((miss + 1)); }

rm -f "$status"
echo "临时文件已删除：$status"
if [ "$miss" -eq 0 ]; then echo "全部完成"; else echo "还差 $miss 项"; exit 1; fi
