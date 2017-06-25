#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

clear;
. $THISDIR/jwt-refresh.sh
SLSDATA="{ \"headers\": { \"jwt\": \"$JWT\" } }"
echo invoking w/ data: $SLSDATA
# Note the node --inspect trick to use devtools debugger from https://github.com/serverless/serverless/issues/281#issuecomment-309195150
node --debug-brk --inspect $(which serverless)  invoke local -f ping --data "$SLSDATA" | jq
