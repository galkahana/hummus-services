'use strict';

module.exports = function(err, req, res, next) {

    res.status(err.status || 500);

    // development error handler - will print stacktrace
    // production error handler - no stacktraces leaked to user
    var errData = (process.env.NODE_ENV === 'development') ? err : {};
    
    res.format({
        text: function () {
            res.send(err.message);
        },

        html: function () {
            res.render('error', {
                    message: err.message,
                    error: errData,
                    info: err.info
                });
        },

        json: function () {
            res.json({
                message: err.message,
                error: errData,
                info: err.info
            });
        }
    });
};