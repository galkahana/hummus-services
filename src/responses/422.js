module.exports = function(req, res, next) {

    /**
     * Decorating response object with notFound object
     * @param message message to embed in error
     */
    res.unprocessable = function(err, message) {
        err = message? new Error(message) : (err || new Error());

        if (message) {
            err.message = message;
        }

        err.status = 422;
        next(err);
    }
    next();
}
