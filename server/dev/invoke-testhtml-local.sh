#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

. $THISDIR/jwt-refresh.sh
clear
sls invoke local -f testhtml -p $THISDIR/path.json