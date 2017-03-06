#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

clear
sls invoke local -f testhtml -p $THISDIR/path.json