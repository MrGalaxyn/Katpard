var fs = require('fs');
var config = require('../../config/config');
// var Canvas = require('canvas');

module.exports = function (app) {
    this.saveimg = function(req, res){
    /* 此接口已经废弃不用,另外node-canvas的安装太麻烦
        var imgData = req.body.imgData;
        var fileName = req.body.name ? req.body.name : (new Date().getTime());
        var img = new Canvas.Image;

        img.onload = function(){
            var w = img.width;
            var h = img.height;
            var canvas = new Canvas(w, h);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            console.log(config.root + "/img/chart/" + fileName +".jpg");
             var out = fs.createWriteStream(config.root + "/img/chart/" + fileName +".jpg");
             var stream = canvas.createJPEGStream({
                 quality: 80
             });

             stream.on('data', function(chunk){
                 out.write(chunk);
             });

             stream.on('end', function(){
                 out.end();
                 res.json({
                     code : 100000,
                     msg : '成功',
                     data: fileName
                 });
             });
        }

        img.onerror = function(err){
            res.json({
                code : 100000,
                msg : 'err',
                data: err
            });
        }

        img.src = imgData;*/
    };
};

