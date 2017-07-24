#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

die () {
	printf >&2 "$@"
	exit 1
}

pushd .

cd $THISDIR

clear;

[[ -d ./dist ]] || (mkdir ./dist && mkdir ./dist/fonts)


./node_modules/.bin/rollup --config
result=$?
echo "rollup result: $result"
if [[ result -ne 0 ]]; then 
	popd
	die '\nrollup build failed!\n\n'
fi

cp -v ./src/*.html ./dist/  || die 'copy failed: html'
cp -v ./src/*.css ./dist/   || die 'copy failed: css'
cp -v ./src/*.js ./dist/    || die 'copy failed: js'
cp -rv ./src/vendor ./dist/ || die 'copy failed: vendor'
cp -v ./src/vendor-fonts/* ./dist/fonts/ || die 'copy failed: fonts'

popd