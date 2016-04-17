var User = require('../models/users'),
    AccessToken = require('../models/access-tokens'),
    passport = require('passport'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    LocalStrategy = require('passport-local').Strategy,
    crypto = require('crypto');


// configure strategies

// bearer configuration
passport.use(new BearerStrategy(function(accessToken, done) {
        AccessToken
            .findOne({value: accessToken})
            .exec(function(err, token) {
                if (err) {
                    return done(err);
                }

                if (!token) {
                    return done(null, false);
                }

                User.findOne({_id: token.userId})
                    .exec(function(err, user) {
                        if (err) {
                            return done(err);
                        }

                        if (!user) {
                            return done(null, false);
                        }

                        done(null, user, {provider: 'bearer', accessToken : accessToken});
                    });
            })
}));

// login

function passwordOK(user,password) {
    return user.password == encryptPassword(password);
}

function encryptPassword(password) {
    return crypto.createHash('sha256').update(password).digest('base64');
};

passport.use('login', new LocalStrategy(
    function(username, password, done) {
        User.findOne({$or: [{email: username}, {name: username}]})
            .select('password')
            .exec(function(err, user) {
                if (err) {
                    return done(err);
                }

                if (user && passwordOK(user,password)) {
                    return done(null, user, {provider: 'login'});
                } else {
                    return done(null, false);
                }
            });
    }
));

// use 'em 
function AuthenticationService() {
    
}

function ensureAuthentication(req, res, next) {
    if (!req.user) {
        return res.unauthenticated('Unauthenticated request');
    }
    return next();
};

function authenticate(req,res,next) {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
        
    passport.authenticate(['bearer'], {session: false}, function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next();
        }

        req.user = user;
        req.info = info;

        return next();
    })(req, res, next);
}

function login(req,res,next) {
    passport.authenticate(['login'], {session: false}, function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next();
        }

        req.user = user;
        req.info = info;

        return next();
    })(req, res, next);
}


AuthenticationService.prototype.authenticate  = authenticate
AuthenticationService.prototype.authenticateOrDie = [authenticate,ensureAuthentication];
AuthenticationService.prototype.loginOrDie = [login,ensureAuthentication];

module.exports = new AuthenticationService();