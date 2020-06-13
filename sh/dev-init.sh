#!/bin/bash

if [ -z "$1" ]; then
  echo "No token provided."
  exit 1
fi

encoded=$(printf '%s' $1 | base64)
secret_path="./src/appsettings.secrets.ts"
echo "export const ps = '$encoded';" > $secret_path
echo "Base64 encoded key written to $secret_path"
