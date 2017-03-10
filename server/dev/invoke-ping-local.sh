#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

clear;
. $THISDIR/jwt-refresh.sh
SLSDATA="{ \"headers\": { \"jwt\": \"$JWT\" } }"
echo invoking w/ data: $SLSDATA
sls invoke local -f ping --data "$SLSDATA" | jq
