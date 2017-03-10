#!/bin/bash
pushd .
cd ../client
./build.sh
popd
sls deploy --verbose