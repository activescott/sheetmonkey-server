#!/bin/bash

# to make affect enviornment you must soruce this script like `. jwt-refresh.sh`
export JWT=`sls invoke local -f jwt | jq -r .body | jq -r .jwt_token`
echo set JWT to:
echo $JWT