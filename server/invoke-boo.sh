#!/bin/bash
clear
BASE_URL=https://pdloc8euy7.execute-api.us-west-2.amazonaws.com/beta
FUNC_PATH=boo
VERBOSE= #-v # to show request/response headers & more
SILENT= #--silent makes the progress meter not get shown (this is also not shown if we pipe curl's output too)

# this worked: curl -H "jwt:$JWT" https://pdloc8euy7.execute-api.us-west-2.amazonaws.com/beta/boo

echo $BASE_URL/$FUNC_PATH
curl $VERBOSE $SILENT -H "jwt:$JWT" $BASE_URL/$FUNC_PATH | jq
