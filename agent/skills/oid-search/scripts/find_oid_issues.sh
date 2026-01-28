#!/bin/bash
# Find ObjectId usage issues in TypeScript files
# Usage: ./find_oid_issues.sh <directory>

DIR="${1:-.}"

echo "=== Searching for ObjectId issues in: $DIR ==="
echo ""

echo "## Pattern 1: Direct _id with string variable"
echo "-------------------------------------------"
rg -n "{ _id: ctx\." --type ts "$DIR" 2>/dev/null || echo "(none found)"
rg -n '\{ _id: [a-z_]+[,\s}]' --type ts "$DIR" 2>/dev/null | grep -v "oid_query" || echo "(none found)"
echo ""

echo "## Pattern 2: Combined _id + owner"
echo "----------------------------------"
rg -n '_id:.*owner:' --type ts "$DIR" 2>/dev/null | grep -v "oid" || echo "(none found)"
echo ""

echo "## Pattern 3: \$in with _id"
echo "--------------------------"
rg -n '_id:.*\$in' --type ts "$DIR" 2>/dev/null | grep -v "oid" || echo "(none found)"
echo ""

echo "## All find_one with _id (review these)"
echo "---------------------------------------"
rg -n 'find_one\(\s*\{[^}]*_id:' --type ts "$DIR" 2>/dev/null | grep -v "oid_query" || echo "(none found)"
echo ""

echo "## All update with _id (review these)"
echo "-------------------------------------"
rg -n 'update\(\s*\{[^}]*_id:' --type ts "$DIR" 2>/dev/null | grep -v "oid" || echo "(none found)"
echo ""

echo "=== Search complete ==="
