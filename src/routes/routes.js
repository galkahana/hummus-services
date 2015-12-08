'use strict';

var api = require('./api.js');


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
};

module.exports = routes;