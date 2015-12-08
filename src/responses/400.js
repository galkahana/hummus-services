/**
 * Catch 400 and forward to error handler
 * @param req request object
 * @param res response object to decorate
 * @param next callback for error handler
 */
module.exports = function(req, res, next) {

    /**
     * Decorating response object with notFound object
     * @param message message to embed in error
     */
    res.badRequest = function(message) {
        var err = new Error(message || 'Not Found');
        err.status = 400;
        next(err);
    }
    next();
}
