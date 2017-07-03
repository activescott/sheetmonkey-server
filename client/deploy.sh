#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

die () {
	printf >&2 "$@"
	exit 1
}

pushd .

cd $THISDIR

./build.sh

if [ $? -eq 0 ] ; then

  rm -rfd ../server/data/public/*
  cp -rvr ./dist/* ../server/data/public/

fi


popd