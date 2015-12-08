/**
 * Catch 403 and forward to error handler
 * @param req request object
 * @param res response object to decorate
 * @param next callback for error handler
 */
module.exports = function(req, res, next) {

    /**
     * Decorating response object with notFound object
     * @param message message to embed in error
     */
    res.forbidden = function(message) {
        var error = new Error(message || 'Access denied: you are not permitted to perform this action.');
        error.status = 403;
        next(error);
    };
    next();
}