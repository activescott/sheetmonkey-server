#!/bin/bash

# NOTE: Assumes you have run docker-build.sh to build the container from the Dockerfile
docker run --rm --user docker -v "$PWD":/usr/src/myapp -w /usr/src/myapp sms yarn test
if [ $? -ne 0 ]; then
    echo 
    echo "docker run command failed! Have you run ./docker-build.sh?"
    echo 
fi