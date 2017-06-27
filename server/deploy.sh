#!/bin/bash
die () {
	printf >&2 "$@"
	exit 1
}
npm test

[ $? -eq 0 ] || die "\n\n**********\nTESTS FAILED, no deploy for you!\n**********\n\n"

pushd .
cd ../client
./build.sh
popd
sls deploy --verbose