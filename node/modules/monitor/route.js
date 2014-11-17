module.exports = function (app) {
    var Monitor = require('./controller');
    var monitor = new Monitor(app);
    
    app.post('/monitor/saveTiming', monitor.saveTiming);
};
