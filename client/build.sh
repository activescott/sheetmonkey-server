#!/bin/bash
clear;
rm -rfd ./dist/*

cp -v ./src/*.html ./dist/
cp -v ./src/*.css ./dist/
cp -v ./src/*.js ./dist/


echo "Running rollup..."
##rollup --config 
npm run dev
echo "Running rollup complete."
