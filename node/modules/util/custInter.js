var request = require('request');

module.exports = function (app) {
    this.custInter = function(req, res){
        var url = req.query.url;

        request.get(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                res.send(body);
            }
            else {
                res.json({
                    code : 100001,
                    msg : 'err',
                    data: error
                });
            }
        });
    };
};

