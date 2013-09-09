#!/bin/bash

if [ -f /home/vagrant/installed ]; then
echo "Setup already completed.. skipping. To run this again, remove /home/vagrant/installed"
  exit 0
fi

# getting required packages
sudo apt-get update
sudo apt-get install -y python-software-properties python g++ make python-pip
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install -y build-essential python-dev automake libtool autoconf pkg-config
sudo apt-get install -y nodejs git subversion

# Getting convenient packages
sudo apt-get install -y nginx

# Installing LevelDB as it is a bitch to do.
cd /tmp
svn checkout http://py-leveldb.googlecode.com/svn/trunk/ py-leveldb-read-only
cd py-leveldb-read-only
./compile_leveldb.sh
python setup.py build
sudo python setup.py install

# Setup project directory.
cd /projecto
mkdir -p databases
mkdir -p userfiles

# Install additional requirements
sudo pip install -r requirements.txt
npm install -g uglify-js

# Configuration for nginx. You can set the "projecto" to point to 192.168.33.10
# on your host machine.
cat >/etc/nginx/sites-available/projecto <<EOL
server {
    listen       80;
    server_name  projecto;

    access_log  off;
    error_log off;

    location / {
        proxy_pass         http://127.0.0.1:8800/;
        proxy_redirect     off;

        proxy_set_header   Host             \$host;
        proxy_set_header   X-Real-IP        \$remote_addr;
        proxy_set_header   X-Forwarded-For  \$proxy_add_x_forwarded_for;
        proxy_max_temp_file_size 0;

        client_max_body_size       10m;
        client_body_buffer_size    128k;

        proxy_connect_timeout      150;
        proxy_send_timeout         150;
        proxy_read_timeout         150;

        proxy_buffer_size          4k;
        proxy_buffers              4 32k;
        proxy_busy_buffers_size    64k;
        proxy_temp_file_write_size 64k;
    }
}

EOL

# Get nginx ready.
sudo ln -s /etc/nginx/sites-available/projecto /etc/nginx/sites-enabled/projecto
sudo service nginx restart

# shortcuts
echo "cd /projecto" >> /home/vagrant/.bashrc
echo "alias t='cd /projecto; python -m unittest discover'" >> /home/vagrant/.bashrc
echo "alias s='cd /projecto; python server.py'" >> /home/vagrant/.bashrc

# make installed flag
touch /home/vagrant/installed
