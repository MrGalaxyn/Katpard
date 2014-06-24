#!/bin/bash
#works on linux system

BASEDIR=$(dirname $0)
PID=$BASEDIR/.pid
count=`ps -wef|grep katpard.js |grep -v grep |wc -l`
if [ "$count" -eq 0 ]; then
    nohup node ${BASEDIR}/node/katpard.js  >  ${BASEDIR}/log/server.log 2>&1 &
    sleep 2
    echo 'server start...'
    exit 0
else
    if [ -f $PID ]; then
        cat $PID
        echo ' killed '
        cat $PID | xargs kill
    else
        pkill -f katpard-server
    fi

    if [ $1='false' ]; then
        sleep 2
        echo 'server shutdown...'
        exit 0
    fi
fi

# 启动服务器; 服务器日志默认定向到server目录下log.txt
nohup node ${BASEDIR}/node/katpard.js  > ${BASEDIR}/log/server.log 2>&1 &

echo 'waiting...'
sleep 2
cat ${BASEDIR}/log/server.log

exit 0
