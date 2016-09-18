var request = require('request'),
    querystring = require('querystring');


function GoogleCapchaService() {

}

var ERROR_TO_MESSAGE = {
    'missing-input-secret':'The secret parameter is missing.',
    'invalid-input-secret':'The secret parameter is invalid or malformed.',
    'missing-input-response':'The response parameter is missing.',
    'invalid-input-response':'The response parameter is invalid or malformed.'   
};

GoogleCapchaService.prototype.checkcapcha = function(req,res,next) {
    var capchaResponse = req.headers['hmscpa'];

    // Check for missing capcha
    if(!capchaResponse) {
        var newError = new Error('Missing Capcha, Try Again');
        if(!newError.info)
            newError.info = {};
        newError.info.noCapcha = true;
        return next(newError);
    }

    // Check capcha  
    var post_data = {
            secret: '6LfdAgcUAAAAAGGkwC4a98VS0DixNqePVtVUToZb',
            response:capchaResponse
    };

    request.post('https://www.google.com/recaptcha/api/siteverify',{form:post_data}, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            var response = JSON.parse(body);

            if(response.success) {
                return next();
            }
            else {
                return next(new Error('Capcha Error, Try Again'));
            }
        }
        else
            return next(err || new Error('Bad response, Try Again'));
    });  

}

module.exports = new GoogleCapchaService();