/**
 * routings, you can defined your own like below
 */
module.exports = function (app) {
    var Ria = require('./controller');
    var ria = new Ria(app);
    
    app.get('/ria/getTiming', ria.getTiming);
    app.get('/ria/getOther', ria.getOther);
    app.get('/ria/getSummary', ria.getSummary);
    app.get('/ria/getHar', ria.getHar);
};
