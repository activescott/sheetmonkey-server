#!/bin/bash
clear;
./clean.sh

cp -v ./src/*.html ./dist/
cp -v ./src/*.css ./dist/
cp -v ./src/*.js ./dist/


echo "Running rollup..."
##rollup --config 
npm run dev
echo "Running rollup complete."
