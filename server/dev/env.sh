#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory

clear;
sls invoke local -v -f env | jq -r .body | jq -r .env