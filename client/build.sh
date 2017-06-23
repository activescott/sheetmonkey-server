#!/bin/bash
clear;
./clean.sh

cp -v ./src/*.html ./dist/
cp -v ./src/*.css ./dist/
cp -v ./src/*.js ./dist/

echo "Running rollup..."
rollup --config
echo "Running rollup complete."
rm -rfd ../server/data/public/*
cp -v ./dist/* ../server/data/public/