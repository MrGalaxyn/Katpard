Katpard
===========

## Requirements

* [NodeJS](http://nodejs.org)
* [MongoDB](http://www.mongodb.org/)

## Installation

> At first, you need to do some configuration, tell us your nodejs path and a mongodb address(include username and password)

```
cd katpard
sh build.sh
# install the dependencies
npm install
# start the server
./restart.sh
# add monitor data service to crond
cat cron >> /etc/crontab
```

##LICENCE
MIT

