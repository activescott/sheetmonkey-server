#!/bin/bash
clear;
./clean.sh

die () {
	printf >&2 "$@"
	exit 1
}

npm run lint || die '\nlint failed!\n\n'

open ./dist/index.html

nodemon -e js,html,svelte --ignore dist/ --exec './build.sh'
