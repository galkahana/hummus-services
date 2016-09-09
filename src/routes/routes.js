'use strict';

var api = require('./api.js'),
    web = require('./web.js'),
    tasks = require('./tasks.js');


var routes = function(app) {
    // remove double slashes
    app.use(function (req,res,next) {
        if(req.url.indexOf('//') > -1 && req.url.length > 1) {
            req.url = req.url.replace(/[/]+/g, '/');
            res.redirect(301, req.url);
        }
        next();
    });

    app.use('/api', api);
    app.use('/tasks', tasks);
    app.use('/', web);
};

module.exports = routes;