module.exports = function(req, res, next) {

    /**
     * Decorating response object with notFound object
     * @param message message to embed in error
     */
    res.serverError = function(err) {
        err = new Error('Internal server error');
        err.status = 500;
        next(err);
    };
    next();
};
