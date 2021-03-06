![katpard](http://ww2.sinaimg.cn/mw690/8fd2dbb4jw1eio4kpbe68j203k01ea9v.jpg)
===========
# What is Katpard
Katpard是一套前端页面性能检测系统，这套系统是为了帮助前端开发人员能够快速准确的了解页面性能状况

# 适用场景
* 日常的性能预警
* 页面性能对比

# Requirements
Katpard 依赖 [NodeJS](http://nodejs.org) 和 [MongoDB](http://www.mongodb.org/) 来存取数据，因此在使用本系统前请务必安装nodejs（推荐0.10.x+）以及mongoDB。另外，你需要下载[PhantomJS (v1.9.7)](https://github.com/ariya/phantomjs)的源码，并使用我们的代码覆盖相应的文件，将编译后的文件放在automation/bin/ 目录，来获得katpard系统需要的支持

# 部署
自动部署前，你必须提供一个mongoDB的地址以及可用账户及密码，和node可执行文件的路径
当然你也可以按照项目脚本中的命令，自己操作。

```shell
cd katpard
sh build.sh
# install the dependencies
npm install
# start the server
./restart.sh
# add monitor data service to crond
cat cron >> /etc/crontab
```

# 系统结构图
![design](http://ww3.sinaimg.cn/mw690/8fd2dbb4jw1eio4hzcaasj20go07hgmc.jpg)

# Features
###1. 自动登陆
Katpard可以自动登陆微博与腾讯微博的页面

###2. UA模拟
Katpard系统中，你可以设置模拟某类终端的UA，从而获取比如移动端H5页面的数据

###3. 首屏时间
####我们的首屏时间算法如下：

    1. 从 urlChanged 事件触发开始计时；
    2. 按照当前视口区域平均分布 14400 个像素监控点；
    3. 每 250 ms 检测一次所有监控点 RGB 值变化；
    4. 如果连续 12 次大于 12400 个像素点无变化，则结束计时，减去检测耗时。
       
###4. 丰富的数据
####Katpard提供的数据如下：
* **时间数据**
    * httpTrafficCompleted: 收到最后一个字节HTTP请求的时间(ms)
    * timeToFirstResFirstByte: 收到首次响应首个字节的时间(ms)
    * slowestResponse: 最长响应时间(ms)
    * onDOMReadyTime: 触发onDOMready事件的时间(ms)
    * windowOnLoadTime: 触发onLoad事件的时间(ms)
    * timeBackend: 后端响应时间占比[%]
    * timeFrontend: 后端响应时间占比[%]
    * timeToFirstScreenFinished: 首屏时间(ms)
    * timeToFirstPaintRequested: 白屏时间(ms)
    * timeToFirstCss: 接收首个css文件最后一个字节的时间(ms)
    * timeToFirstJs: 接收首个js文件最后一个字节的时间(ms)
* **DOM相关**
    * DOMqueries: 全部DOM操作数
    * DOMqueriesById: document.getElementById调用次数
    * DOMqueriesByClassName: document.getElementsByClassName调用次数
    * DOMqueriesByTagName: document.getElementsByTagName调用次数
    * DOMqueriesByQuerySelectorAll: document.querySelectorAll调用次数
    * DOMinserts: DOM节点插入次数
    * DOMqueriesDuplicated: 重复DOM查询次数
    * DOMelementsCount: DOM节点数
    * DOMelementMaxDepth: 最大DOM节点层数
    * nodesWithInlineCSS: 带有style属性的DOM节点数
* **请求相关**
    * maxRequestsPerDomain: 单域下最多请求数
    * medianRequestsPerDomain: 各域请求中位数
    * requests: HTTP请求总数
    * notFound: 404的HTTP请求数
    * ajaxRequests: 页面AJAX请求数
* **文件内容相关**
    * htmlCount: HTML文件响应数
    * htmlSize: HTML响应总字节数
    * cssCount: CSS文件响应数
    * cssSize: CSS响应总字节数
    * jsCount: JS文件响应数
    * jsSize: JS响应总字节数
    * consoleMessages: console.*类函数调用数
    * imageCount: 图片文件响应数
    * imageSize: 图片响应总字节数
* **HAR文件相关**

# 感谢
感谢以下的项目,排名不分先后

* [PhantomJS](https://github.com/ariya/phantomjs)
* [MEAN.io](https://github.com/linnovate/mean)
* [berserkJS](https://github.com/tapir-dream/berserkJS)
* [CasperJS](https://github.com/n1k0/casperjs)
* [YSlow](https://github.com/marcelduran/yslow)
* [CanvasJS](http://canvasjs.com/)
* [HAR Viewer](https://github.com/janodvarko/harviewer)
* [charisma](https://github.com/usmanhalalit/charisma)

非常感谢[@Cherish_Yui_1388](http://weibo.com/daiyiyi1991)将README翻译成英文版

# 更新
* **v1.1.0**
    * 修改之前存在的某些bug
    * 优化后端数据计算的算法
    * 更改前端统计页面的样式，增加白屏时间，去掉了DOM与load时间，增加评分概念(通过首屏与首包时间计算)
    * 增加修改的phantomJS的源代码，主要是在phantomJS中增加了首屏时间与白屏时间
    * 增加了新的采样方法，详见php/cron/monitor.php
    * 修改了取样的窗口大小为1280 * 800，增加对自定义userAgent的支持

#LICENCE
MIT

*******************************************************************************

![katpard](http://ww2.sinaimg.cn/mw690/8fd2dbb4jw1eio4kpbe68j203k01ea9v.jpg)
===========
# What is Katpard
Katpard is a front-end performance monitoring system, the purpose of this system is to help front-end developers know the performance status of pages rapidly and exactly.

# Intended Use Cases
* Daily performance monitoring
* page performance comparison

# Requirements
Katpard depends on [NodeJS](http://nodejs.org) and [MongoDB](http://www.mongodb.org/) to access data, so please install nodejs (recommend 0.10.x+) and mongoDB before you use this system.Meanwhile, you should download the source code of [PhantomJS (v1.9.7)](https://github.com/ariya/phantomjs), and substitute with the specified file we provide in our code, build it and copy it to the path automation/bin/phantomjs

# Deployment
Before deployment automation, you have to provide a mongoDB address and an available account, password, and path for node executable file. Of course you can operate by yourself according to the commands in the project script.

```shell
cd katpard
sh build.sh
# install the dependencies
npm install
# start the server
./restart.sh
# add monitor data service to crond
cat cron >> /etc/crontab
```

# System Structure
![design](http://ww3.sinaimg.cn/mw690/8fd2dbb4jw1eio4hzcaasj20go07hgmc.jpg)

# Features
###1. Auto login
Katpard can login in Weibo and Tencent Weibo automatically.

###2. UA simulation
In Katpard, you can set to simulate UA of some kind of terminal, thus you can obtain data such as mobile side H5 page. 

###3. Start Render
#### The algorithm of start render is as following:
   
   1. Start the time from urlChanged event is triggered;
   2. Even distribute current viewport region to 14400 pixel monitory points.
   3. Detect RGB value of all the monitory points every 250 ms.
   4. If more than 12400 pixel points have no change in continuous 12 times, timing ends, and then minus the detection time.

###4. Rich Data
####Katpard provide the following data:
* **Timing**
    * httpTrafficCompleted: time it took to receive the last byte of the last HTTP response(ms)
    * timeToFirstResFirstByte: time it took to receive the 1st byte of the first response(ms)
    * slowestResponse: time to the last byte of the slowest response(ms)
    * onDOMReadyTime: time it took to fire onDOMready event(ms)
    * windowOnLoadTime: time it took to fire window.load event(ms)
    * timeBackend: time to the first byte compared to the total loading time[%]
    * timeFrontend: time to window.load compared to the total loading time[%]
    * timeToFirstScreenFinished: time it took to finish render first screen(ms)
    * timeToFirstPaintRequested: time it took to start the first paint(ms)
    * timeToFirstCss: time it took to receive the last byte of the first CSS(ms)
    * timeToFirstJs: time it took to receive the last byte of the first JS(ms)
* **DOM**
    * DOMqueries: number of all DOM queries
    * DOMqueriesById: number of document.getElementById calls
    * DOMqueriesByClassName: number of document.getElementsByClassName calls
    * DOMqueriesByTagName: number of document.getElementsByTagName calls
    * DOMqueriesByQuerySelectorAll: number of document.querySelectorAll calls
    * DOMinserts: number of DOM nodes inserts
    * DOMqueriesDuplicated: number of duplicated DOM queries
    * DOMelementsCount: total number of HTML element nodes
    * DOMelementMaxDepth: maximum level on nesting of HTML element node
    * nodesWithInlineCSS: number of nodes with inline CSS styling (with style attribute)
* **Requests**
    * maxRequestsPerDomain: maximum number of requests fetched from a single domain
    * medianRequestsPerDomain: median of number of requests fetched from each domain
    * requests: total number of HTTP requests made
    * notFound: number of HTTP 404 responses
    * ajaxRequests: number of AJAX requests
* **Static Resource** 
    * htmlCount: number of HTML responses
    * htmlSize: size of HTML responses
    * cssCount: number of CSS responses
    * cssSize: size of CSS responses
    * jsCount: number of JS responses
    * jsSize: size of JS responses
    * consoleMessages: number of calls to console.* functions
    * imageCount: number of image responses
    * imageSize: size of image responses
* **HAR File Relevant**

# Acknowledgements
Thanks the following projects, this list is in no particular order

* [PhantomJS](https://github.com/ariya/phantomjs)
* [MEAN.io](https://github.com/linnovate/mean)
* [berserkJS](https://github.com/tapir-dream/berserkJS)
* [CasperJS](https://github.com/n1k0/casperjs)
* [YSlow](https://github.com/marcelduran/yslow)
* [CanvasJS](http://canvasjs.com/)
* [HAR Viewer](https://github.com/janodvarko/harviewer)
* [charisma](https://github.com/usmanhalalit/charisma)

Special thanks to [Yui Dai](https://www.facebook.com/profile.php?id=100004219414353) for this English version README

# Update
* **v1.1.0**
    * Fixed some bug in v1.1.0
    * Optimzed the algorithm. If that's not good enough for you, try the script node/cron/cache/ria_result_calculate.js to make a cache
    * Changed the page style of performace data page, add start painting time,remove DOM and page load time, add a score which based on first screen and first byte
    * Added the phantomjs source code we modified for katpard system, just build it for your machine
    * Added a new way to get performace data, read php/cron/monitor.php for detail
    * Changed the view port of the monitor page to 1280 * 800, and you can customize userAgent now

#LICENCE
MIT