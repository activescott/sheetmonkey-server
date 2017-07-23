#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory
clear;
./clean.sh

die () {
	printf >&2 "$@"
	exit 1
}

npm run lint || die '\nlint failed!\n\n'

nodemon -e js,html,svelte --ignore dist/ --exec './build.sh && echo "\n\nNow run ./serve.sh from another shell window to serve the site locally.\n\n"'
