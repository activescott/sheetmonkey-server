#!/bin/bash
clear;
./clean.sh

die () {
	printf >&2 "$@"
	exit 1
}

npm run lint || die '\nlint failed!\n\n'

cp -v ./src/*.html ./dist/
cp -v ./src/*.css ./dist/
cp -v ./src/*.js ./dist/

open ./dist/index.html

npm run dev
