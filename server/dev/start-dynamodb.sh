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
  # first just install it, I've seen this suspiciously not be installed multiple times - maybe yarn does it??
  #####$(dirname $THISDIR)/node_modules/.bin/serverless dynamodb install <- Downloaded and installed manually instead.
  # The below seems to be more reseliant than the above `sls dynamodb start` command
  java -Djava.library.path=$THISDIR/ddb-local/DynamoDBLocal_lib -jar $THISDIR/ddb-local/DynamoDBLocal.jar -inMemory -sharedDb &
  #####$(dirname $THISDIR)/node_modules/.bin/serverless dynamodb start --migrate &  
  # wait a few secs to let DDB start then open the DDB shell (to let the user know what's going on)
  #sleep 3s && open http://localhost:8000/shell
  echo
  
  echo 'calling migrate...'
  echo '...sleeping to give DDB chance to start...'
  sleep 3s
  # below fails with Resource In Use Exception:
  $(dirname $THISDIR)/node_modules/.bin/serverless dynamodb migrate
  echo 'calling migrate complete.'
fi
