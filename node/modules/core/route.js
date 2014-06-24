var core = require('./controller');
module.exports = function (app) {
    app.get('/', core.index);
};
