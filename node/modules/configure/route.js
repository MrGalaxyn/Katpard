module.exports = function (app) {
    var Configure = require('./controller');
    var configure = new Configure(app);
    app.get('/configure/getUrl', configure.getUrl);
    app.post('/configure/delUrl', configure.delUrl);
    app.post('/configure/editUrl', configure.editUrl);
    app.post('/configure/addUrl', configure.addUrl);
};
