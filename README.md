#katpard web page monitor
===========

#prepare

Node.js
Download and Install Node.js

MongoDB
Download and Install MongoDB - Make sure you have a database for katpard

NPM
Node.js package manager, should already be installed as part of Node.js
===========

#install

## Linux

### do some prepare work, you need to tell us where your node path and a mongodb address(include username and password), that is important!
cd katpard
sh build.sh
### install the dependencies
npm install
### start the server
./restart.sh
### add monitor data service to crond
cat cron >> /etc/crontab


#LICENCE
MIT

