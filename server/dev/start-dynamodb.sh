#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

clear;

# `nc -z localhost 8000` checks to see if DDB is listening on port 8000
# note The & operator puts command in the background and free up terminal.
#nc -z localhost 8000 || (sls dynamodb start --migrate &) && sleep 3s && open http://localhost:8000/shell

nc -z localhost 8000
if [[ $? -eq 0 ]] ; then
  echo 'DDB Local is already running.'
else
  echo 'DDB Local not running. Starting...'
  sls dynamodb start --migrate &
  # wait a few secs to let DDB start then open the DDB shell (to let the user know what's going on)
  sleep 3s && open http://localhost:8000/shell
fi
