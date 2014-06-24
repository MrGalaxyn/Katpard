#!/bin/bash

########定时(1分钟?)监控服务器进程,如果死了就重启################



count=`ps -wef|grep httpd.js |grep -v grep |wc -l`
if [ "$count" -eq 0 ]; then
    nohup node /data1/pageMonitor/node/httpd.js  > /data1/pageMonitor/log/server.log 2>&1 &
fi