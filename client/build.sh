#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

pushd .

cd $THISDIR

clear;

./clean.sh

rollup --config
if [ $? -eq 0 ] ; then

  cp -v ./src/*.html ./dist/
  cp -v ./src/*.css ./dist/
  cp -v ./src/*.js ./dist/

  rm -rfd ../server/data/public/*
  cp -v ./dist/* ../server/data/public/

fi


popd