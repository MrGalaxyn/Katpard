![katpard](http://ww2.sinaimg.cn/mw690/8fd2dbb4jw1eio4kpbe68j203k01ea9v.jpg)
===========
# What is Katpard
Katpard是一套前端页面性能检测系统，这套系统是为了帮助前端开发人员能够快速准确的了解页面性能状况

# 适用场景
* 日常的性能预警
* 页面性能对比

# Requirements
Katpard 依赖 [NodeJS](http://nodejs.org) 和 [MongoDB](http://www.mongodb.org/) 来存取数据，因此在使用本系统前请务必安装nodejs（推荐0.10.x+）以及mongoDB


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
Katpard可以自动微博与腾讯微博的页面

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
    * timeTofirstScreenFinished: 首屏时间(ms)
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

#TO DO

1. 增加带宽模拟功能
2. 提供完善的评分、优化建议功能
3. 让图表展示更漂亮
4. 优化算法，提升后端node数据计算的速度
5. ...

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


#LICENCE
MIT
