/**
 * Catch 404 and forward to error handler
 * @param req request object
 * @param res response object to decorate
 * @param next callback for error handler
 */
module.exports = function(req, res, next) {

    /**
     * Decorating response object with notFound object
     * @param message message to embed in error
     */
    res.notFound = function(message) {
        var err = new Error(message || 'Not Found');
        err.status = 404;
        next(err);
    }
    next();
}
