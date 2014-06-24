var fs = require('fs');
var path = require('path');
// 创建所有目录
var mkdirs = module.exports.mkdirs = function(dirpath, mode, callback) {
    path.exists(dirpath, function(exists) {
        if(exists) {
            callback(dirpath);
        } else {
            //尝试创建父目录，然后再创建当前目录
            mkdirs(path.dirname(dirpath), mode, function(){
                fs.mkdir(dirpath, mode, callback);
            });
        }
    });
};

// 同步创建所有目录
var mkdirsSync = module.exports.mkdirsSync = function(dirpath, mode){
    if (!(dirpath && fs.existsSync(dirpath) && fs.statSync(dirpath).isDirectory())) {
        mkdirsSync(path.dirname(dirpath, mode));
        fs.mkdirSync(dirpath, mode);
    }
}

var deleteFolderRecursive = module.exports.deleteFolderRecursive = function(path) {
    if(!fs.existsSync(path)) {
        return;
    }

    var files = fs.readdirSync(path);
    files.forEach(function(file){
        var curPath = path + "/" + file;
        if(fs.statSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
        } else { // delete file
            fs.unlinkSync(curPath);
        }
    });
    fs.rmdirSync(path);
};