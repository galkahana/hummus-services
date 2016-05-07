var User = require('../models/users'),
    constants = require('../models/constants'),
    AccessToken = require('../models/access-tokens'),
    passport = require('passport'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    LocalStrategy = require('passport-local').Strategy,
    crypto = require('crypto'),
    randomSeconds = require('./random-seconds'),
    CustomStrategy = require('passport-custom');
    moment = require('moment');


// configure strategies

// bearer configuration

function userFromAccessToken(accessToken,done) {
        AccessToken
            .findOne({value: accessToken})
            .exec(function(err, token) {
                if (err) {
                    return done(err);
                }

                if (!token) {
                    return done(null, false);
                }
                
                // for site tokens, check also expiration.
                if(token.tokenType == constants.eTokenRoleSiteUser &&
                    moment().subtract(1, 'hour').isAfter(moment(token.createdAt))) {
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

                        done(null, user, {provider: 'bearer', accessToken : accessToken, accessTokenType: token.tokenType, accessClientId: token.clientId});
                    });
            });    
}

passport.use(new BearerStrategy(userFromAccessToken));

// custom configuration
passport.use('bearer-parameter', new CustomStrategy(
  function(req, callback) {
    return userFromAccessToken(req.query.b,callback);   
  }
));

// login

function passwordOK(user,password) {
    return user.password == encryptPassword(password);
}

function encryptPassword(password) {
    return crypto.createHash('sha256').update(password).digest('base64');
};

passport.use('login', new LocalStrategy(
    function(username, password, done) {
        User.findOne({$or: [{email: username}, {username: username}]})
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

/*
    im faking some wait time to throw of potential hackers a bit.
    ok and maybe make my users db seem large :).
    but mainly for the first reason
*/

function waitRandomSeconds(min,max,cb) {
    setTimeout(cb,randomSeconds(min,max));
}

function ensureAuthentication(req, res, next) {
    if (!req.user) {
        waitRandomSeconds(2,4,function(){
            return res.unauthenticated('Unauthenticated request');
        })
    }
    else
        return next();
};

function authenticate(req,res,next) {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
        
    passport.authenticate(['bearer','bearer-parameter'], {session: false}, function(err, user, info) {
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
AuthenticationService.prototype.login = login;
AuthenticationService.prototype.loginOrDie = [login,ensureAuthentication];
AuthenticationService.prototype.passwordOK = passwordOK;
AuthenticationService.prototype.encryptPassword = encryptPassword;

module.exports = new AuthenticationService();