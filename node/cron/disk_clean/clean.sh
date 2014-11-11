#clean up har files which is out of date
#!/bin/bash
date=`date '+%Y/%m/%d' --date='30 days ago'`
year=`date '+%Y' --date='30 days ago'`
month=`date '+%m' --date='30 days ago'`
day=`date '+%d' --date='30 days ago'`
folder=/data1/pageMonitor/har/${year}/${month}/${day}/

rm -rf $folder

if [ `ls /data1/pageMonitor/har/${year}/${month}/ | wc -l` -eq 0 ]; then
    rm -rf /data1/pageMonitor/har/${year}/${month}/
fi

if [ `ls /data1/pageMonitor/har/${year}/ | wc -l` -eq 0 ]; then
    rm -rf /data1/pageMonitor/har/${year}/
fi

