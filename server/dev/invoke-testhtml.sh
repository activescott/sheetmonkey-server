#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory
. $THISDIR/baseurl.sh
FUNC_PATH=/index.html
VERBOSE= #-v # to show request/response headers & more
SILENT= #--silent makes the progress meter not get shown (this is also not shown if we pipe curl's output too)

clear
curl $VERBOSE $SILENT $BASE_URL/$FUNC_PATH
echo