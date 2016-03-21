var usersModel = require('../models/users');


function UsersService() {
    
}

function ensureAuthenticationForExternalAPI(req, res, next) {
    if (!req.user) {
        return res.unauthenticated('Unauthenticated request for user API');
    }
    return next();
};

function authenticateUserForExternalAPI(req,res,next) {
    // for the sake of the demo fetch the single demo user. later we'll have a propper
    // api to user mapping   
    usersModel.findOne({name:'gal'}, function (err, user) {
        if (err)
            return res.unprocessable(err, message);
        req.user = user;
        next();
    });
}

UsersService.prototype.authenticateUserForExternalAPI  = authenticateUserForExternalAPI
UsersService.prototype.authenticateUserForExternalAPIOrDie = [authenticateUserForExternalAPI,ensureAuthenticationForExternalAPI];

module.exports = new UsersService();