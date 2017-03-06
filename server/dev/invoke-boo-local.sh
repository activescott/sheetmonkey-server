#!/bin/bash
clear;
SLSDATA="{ \"headers\": { \"jwt\": \"$JWT\" } }"
echo invoking w/ data: $SLSDATA
sls invoke local -f boo --data "$SLSDATA"
