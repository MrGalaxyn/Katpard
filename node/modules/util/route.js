// not used in this project
module.exports = function (app) {
    var ReportHandler = require(__dirname + '/report');
    var reportHandler = new ReportHandler(app);
    app.post('/util/sendReport', reportHandler.sendReport);
};
