var usersModel = require('../models/users');


function AuthenticationService() {
    
}

function ensureAuthentication(req, res, next) {
    if (!req.user) {
        return res.unauthenticated('Unauthenticated request');
    }
    return next();
};

function authenticate(req,res,next) {
    // for the sake of the demo fetch the single demo user. later we'll have a propper
    // api to user mapping   
    usersModel.findOne({name:'gal'}, function (err, user) {
        if (err)
            return res.unprocessable(err, message);
        req.user = user;
        next();
    });
}

AuthenticationService.prototype.authenticate  = authenticate
AuthenticationService.prototype.authenticateOrDie = [authenticate,ensureAuthentication];

module.exports = new AuthenticationService();