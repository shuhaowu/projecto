#!/bin/bash

set -e

echo "Running server side tests..."
python -m unittest discover

echo "Running client side tests..."
grunt prod

echo "\o/ Everything works!"
