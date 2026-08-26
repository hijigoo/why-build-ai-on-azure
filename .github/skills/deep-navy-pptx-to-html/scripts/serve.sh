#!/usr/bin/env bash
# 결과물을 로컬 서버로 띄운다.
#
#   bash serve.sh <파일 또는 디렉터리> [포트]
#
# file:// 로 열면 폰트·이미지가 막히는 경우가 있어 검증은 http로 한다.
set -euo pipefail

TARGET="${1:-.}"
PORT="${2:-8749}"

if [ -d "$TARGET" ]; then
  DIR="$TARGET"; FILE=""
else
  DIR="$(cd "$(dirname "$TARGET")" && pwd)"; FILE="$(basename "$TARGET")"
fi

# 이미 떠 있으면 재사용
if curl -s -o /dev/null -m 2 "http://localhost:${PORT}/" 2>/dev/null; then
  echo "포트 ${PORT}에 서버가 이미 떠 있습니다."
else
  (cd "$DIR" && python3 -m http.server "$PORT" >/dev/null 2>&1 &)
  sleep 2
fi

URL="http://localhost:${PORT}/${FILE}"
CODE="$(curl -s -o /dev/null -w '%{http_code}' "$URL" || echo 000)"

if [ "$CODE" = "200" ]; then
  echo "$URL"
else
  echo "서버 응답 $CODE — 경로를 확인하세요: $URL" >&2
  exit 1
fi
