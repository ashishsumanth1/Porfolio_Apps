#!/bin/bash
# Export PostgreSQL data for Railway deployment
# Run this locally before deploying

set -e

OUTPUT_DIR="data/export"
mkdir -p "$OUTPUT_DIR"

echo "Exporting database to $OUTPUT_DIR..."

# Export using pg_dump (schema + data)
PGPASSWORD="${UKMPPR_DB_PASSWORD:-}" pg_dump \
    -h "${UKMPPR_DB_HOST:-localhost}" \
    -p "${UKMPPR_DB_PORT:-5432}" \
    -U "${UKMPPR_DB_USER:-ukmppr}" \
    -d "${UKMPPR_DB_NAME:-ukmppr}" \
    --no-owner \
    --no-privileges \
    -F c \
    -f "$OUTPUT_DIR/ukmppr_backup.dump"

echo "Database exported to $OUTPUT_DIR/ukmppr_backup.dump"
echo ""
echo "To restore on Railway:"
echo "1. Get your Railway PostgreSQL connection string"
echo "2. Run: pg_restore --no-owner --no-privileges -d \$DATABASE_URL $OUTPUT_DIR/ukmppr_backup.dump"
