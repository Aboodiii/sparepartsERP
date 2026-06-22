#!/bin/bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm start
