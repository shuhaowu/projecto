FROM debian:wheezy

MAINTAINER Shuhao Wu <shuhao@shuhaowu.com>

RUN echo "Package: *" >> /etc/apt/preferences ;\
    echo "Pin: release a=unstable" >> /etc/apt/preferences ;\
    echo "Pin-Priority: 1" >> /etc/apt/preferences ;\
    echo "deb http://ftp.us.debian.org/debian sid main contrib non-free" >> /etc/apt/sources.list

RUN apt-get update &&\
    apt-get -y upgrade &&\
    apt-get install -y -t sid python build-essential automake libtool python-pip libevent-dev git python-dev

ADD / /app

RUN cd /root && pip install -r /app/requirements.txt

WORKDIR /app
ENTRYPOINT ["python", "server.py"]
