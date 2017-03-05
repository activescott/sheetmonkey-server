#!/bin/bash

# https://rietta.com/blog/2012/01/27/openssl-generating-rsa-key-from-command/
# gen private+public key in afile:
#openssl genrsa -des3 -out testkey-private.pem 2048
# export public key:
#openssl rsa -in private.pem -outform PEM -pubout -out testkey-public.crt

# https://www.sslshopper.com/article-most-common-openssl-commands.html
KEYNAME=test-key
openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout $KEYNAME-private.pem -out $KEYNAME.crt