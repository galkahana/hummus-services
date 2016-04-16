'use strict';


function Users() {

    this.signIn = function(req, res, next) {
        var params = req.body;
        
        if (!params.username || !params.password) {
            return res.badRequest('Missing credentials');
        }
        
        res.status(200).json({
            accessToken:'whatwhatwhat'
        });   
    };
    
    this.signOut = function(req,res,next) {
        res.status(200).json({
            ok:true
        });   
    }
}


module.exports = new Users();