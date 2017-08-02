#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory
clear;

die () {
	printf >&2 "$@"
	exit 1
}

npm run lint || die '\nlint failed!\n\n'

$THISDIR/node_modules/.bin/nodemon -e js,html,svelte,sh --ignore dist/ --exec './build.sh && echo "\n\nNow run ./serve.sh from another shell window to serve the site locally.\n\n"'
