#!/bin/bash

sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install -y riak nodejs
sudo cp scripts/vagrant/app.config /etc/riak/app.config
sudo service riak start

mkdir -p userfiles

pip install -r requirements.txt
sudo npm install -g karma karma-cli karma-jasmine karma-phantomjs-launcher

cat >settings_local.py <<EOL
DEBUG = True
SECRET_KEY = "abcedfg"
SITE_URL = "http://localhost:8800"

EOL
