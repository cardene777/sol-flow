#!/usr/bin/env bash
# 課題 #13 の受入条件の確認を全部回す。
# Vitest の結果と static-export.sh と check-live.sh を `ok: <名前>` / `not ok: <名前>` の行にそろえ、
# 最後に合計の `Ran N tests` を 1 行だけ出す。
set -u

app_dir=$(cd "$(dirname "$0")/.." && pwd)
report=$(mktemp)
trap 'rm -f "$report"' EXIT
total=0
status=0

(cd "$app_dir" && pnpm exec vitest run --reporter=json --outputFile="$report") > /dev/null 2>&1
node -e '
  const fs = require("fs");
  let data;
  try { data = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); }
  catch { console.log("not measured: vitest wrote no report"); process.exit(0); }
  for (const file of data.testResults) {
    for (const t of file.assertionResults) {
      if (t.status === "passed") console.log("ok: " + t.title);
      else {
        console.log("not ok: " + t.title);
        for (const m of t.failureMessages || []) console.log("  " + m.split("\n")[0]);
      }
    }
  }
  console.log("vitest ran " + data.numTotalTests);
' "$report" > "$report.lines"
grep -v '^vitest ran ' "$report.lines"
vitest_count=$(sed -n 's/^vitest ran \([0-9]*\)$/\1/p' "$report.lines")
grep -q '^not ok: \|^not measured: ' "$report.lines" && status=1
total=$((total + ${vitest_count:-0}))
rm -f "$report.lines"

for script in static-export.sh check-live.sh; do
  output=$(bash "$app_dir/tests/$script")
  [ $? -eq 0 ] || status=1
  echo "$output" | grep -v '^Ran [0-9]* tests$'
  count=$(echo "$output" | sed -n 's/^Ran \([0-9]*\) tests$/\1/p')
  total=$((total + ${count:-0}))
done

echo "Ran $total tests"
exit "$status"
