#!/bin/bash

python -m unittest discover
if [ $? -ne 0 ]; then
  exit 1;
fi

karma start travis.karma.config.js
if [ $? -ne 0 ]; then
  exit 1;
fi
