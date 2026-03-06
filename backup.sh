#!/bin/bash

DATE=$(date +%F-%H-%M)
BACKUP_FILE="hitech-$DATE.sql"

echo "Starting database backup...."

docker exec hitech_postgres pg_dump -U postgres hitech > $BACKUP_FILE

echo "Uploading to S3..."

aws s3 cp $BACKUP_FILE s3://hitech-db-backup/

echo "Removing local file..."

rm $BACKUP_FILE

echo "Backup completed successfully."

