#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory
clear;

die () {
	printf >&2 "$@"
	exit 1
}

sleep 2 && open http://localhost:8111/index.html &
$THISDIR/node_modules/.bin/http-server -p 8111 $THISDIR/dist/

