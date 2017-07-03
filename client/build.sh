#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

die () {
	printf >&2 "$@"
	exit 1
}

pushd .

cd $THISDIR

clear;

./clean.sh

[[ -d ./dist ]] || mkdir ./dist

rollup --config
if [ $? -eq 0 ] ; then

  cp -v ./src/*.html ./dist/
  cp -v ./src/*.css ./dist/
  cp -v ./src/*.js ./dist/
  cp -rv ./src/vendor ./dist/

fi


popd