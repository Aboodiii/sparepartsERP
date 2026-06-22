#!/bin/bash
set -e
cd backend
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js || echo "Seed skipped (data may already exist)"
npm start
