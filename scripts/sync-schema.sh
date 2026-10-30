#!/bin/sh
# 백엔드 SDL(GLog-Backend/src/main/resources/graphql/*.graphqls)을 이어 붙여 docs/api/schema.graphql을 만든다.
# 프론트 계약은 백엔드 스키마 그대로다 — 손으로 고치지 말고 이 스크립트로 다시 만든다.
# 사용: sh scripts/sync-schema.sh [백엔드 graphql 폴더]  (기본: ../GLog-Backend/src/main/resources/graphql)
set -eu
cd "$(dirname "$0")/.."
SRC="${1:-../GLog-Backend/src/main/resources/graphql}"
OUT=docs/api/schema.graphql
{
  echo "# 잔디로그(GLog) GraphQL 계약 — 백엔드 SDL을 이어 붙인 파일 (scripts/sync-schema.sh로 만든다, 손으로 고치지 않는다)"
  # auth.graphqls에 기본 type Query · Mutation이 있어 맨 앞에 둔다
  for f in "$SRC/auth.graphqls" $(ls "$SRC"/*.graphqls | grep -v '/auth.graphqls$' | sort); do
    echo
    echo "# ==== $(basename "$f") ===="
    echo
    cat "$f"
  done
} > "$OUT"
echo "wrote $OUT"
