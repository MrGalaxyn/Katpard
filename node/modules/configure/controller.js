'use strict';

module.exports = function (app) {
    var Url = app.dbconn.pagemonitor.model('monitor_url');

    this.getUrl = function(req, res) {
        Url.find().exec(function(err, urls) {
            if (err) {
                res.json({
                    code: 100001,
                    msg: '错误',
                    data: ''
                });
            } else {
                res.json({
                    code: 100000,
                    msg: '成功',
                    data: urls
                });
            }
        });
    };

    this.addUrl = function(req, res) {
        var reqData = {
            name: req.body.name,
            addr: req.body.addr,
            user: req.body.user ? req.body.user : '',
            password: req.body.password ? req.body.password : '',
            ua: req.body.ua ? req.body.ua : ''
        };

        Url.create(reqData, function(error){
            if(error) {
                res.json({
                    code: 100001,
                    msg: error,
                    data: ''
                });
            } else {
                res.json({
                    code: 100000,
                    msg: '成功',
                    data: ''
                });
            }
        });
    };

    this.editUrl = function(req, res) {
        var reqData = {
            name: req.body.name,
            addr: req.body.addr,
            user: req.body.user ? req.body.user : '',
            password: req.body.password ? req.body.password : '',
            ua: req.body.ua ? req.body.ua : ''
        };
        Url.update({_id: req.body.id}, reqData, function(error) {
            if(error) {
                res.json({
                    code: 100001,
                    msg: error,
                    data: ''
                });
            } else {
                res.json({
                    code: 100000,
                    msg: '成功',
                    data: ''
                });
            }
        });
    };

    this.delUrl = function(req, res) {
        Url.remove({_id: req.body.id}, function(error) {
            if(error) {
                res.json({
                    code: 100001,
                    msg: error,
                    data: ''
                });
            } else {
                res.json({
                    code: 100000,
                    msg: '成功',
                    data: ''
                });
            }
        });
    };
};