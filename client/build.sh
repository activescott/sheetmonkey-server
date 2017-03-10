#!/bin/bash
echo "Running rollup..."
rollup --config
echo "Running rollup complete."
cp -v ./src/test.html ../server/data/public/test.html