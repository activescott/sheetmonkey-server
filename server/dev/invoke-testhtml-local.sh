#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

. $THISDIR/jwt-refresh.sh
clear
env SLS_DEBUG=true sls invoke local -f indexhtml -p $THISDIR/path.json