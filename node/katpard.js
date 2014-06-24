var path = require('path');
var fs = require('fs');
var cluster = require('cluster');
var config = require('./config/httpd');
var createWorkerServer = require('./worker');

if(cluster.isMaster) {
    console.log('katpard master server ' + process.pid);
    // like apache httpd, fork 3 process to do the job 
    var workerNum = config.workerNum || 3;
    var workers = [];
    
    // now is node 0.6.x and 0.8.x compatible
    var isNewCluster = !!cluster.workers;
    
    for(var i = 0; i < workerNum; i++) {
        var worker = cluster.fork();
        workers.push(worker.process ? worker.process.pid : worker.pid);
    }
    
    var ExitEvent = isNewCluster ? 'exit' : 'death';
    // recover the dead child process
    cluster.on(ExitEvent, function(worker) {
        workers.splice(workers.indexOf(worker.process ? worker.process.pid : worker.pid), 1);
        process.nextTick(function () {
            var worker = cluster.fork(); 
            workers.push(worker.process ? worker.process.pid : worker.pid);
        });
    });
    
    process.on('uncaughtException', function(err) {
        console.error('Caught exception: ', err);
    });
    
    var pidPath = path.join(__dirname,'.pid');
    fs.writeFile(pidPath, process.pid);
    
    //kill all the children when master quit
    process.on('SIGTERM', function() {
        // cannot catch SIGKILL by kill -9, just deal with SIGTERM
        workers.forEach(function(pid) {
            console.log('worker '+ pid + ' killed');
            process.kill(pid);
        });

        fs.unlink(pidPath,function(){
            console.log('Master killed');
            process.exit(0);
        });
    });

    setInterval(function() {
        if (!fs.existsSync(pidPath)) {
            console.log('Master pid file gone');
            process.exit(0);
        }
    }, 1000)
    
    process.title = 'katpard-server';//linux only
} else {
    createWorkerServer();
}