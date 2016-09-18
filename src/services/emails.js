var helper = require('sendgrid').mail,
    sg = require('sendgrid')(process.env.SENDGRID_API),
    async = require('async'),
    markdown = require('markdown').markdown,
    mustache = require('mustache'),
    fs = require('fs'),
    path = require('path');


function sendHelloEmail() {
    var from_email = new helper.Email('test@mail.pdfhummus.com');
    var to_email = new helper.Email('gal.bezalel.kahana@gmail.com');
    var subject = 'Hello World from the SendGrid Node.js Library!';
    var content = new helper.Content('text/plain', 'Hello, Email!');
    var mail = new helper.Mail(from_email, subject, to_email, content);

    var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON(),
    });

    sg.API(request, function(error, response) {
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
    });
}

function sendSimpleEmail(from,to,subject,htmlBody,cb) {
    var from_email = new helper.Email(from);
    var to_email = new helper.Email(to);
    var subject = subject;
    var content = new helper.Content('text/html',htmlBody);
    var mail = new helper.Mail(from_email, subject, to_email, content);    
    
    var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
    });

    sg.API(request, function(error, response) {
        if(!error && response.statusCode == 202) {
            cb();
        }
        else {
            cb(error || new Error('Got Wrong Status code ' + response.statusCode));
        }
    });    
}

function sendUserJoinedAdminEmail(user,cb) {
    fs.readFile(path.resolve(path.resolve(__dirname,'./email-templates/joined-admin-email.md')), 'utf8', function(err,data) {
        if(err)
            return cb(err);

        sendSimpleEmail(
            'admin@mail.pdfhummus.com',
            'join@pdfhummus.com',
            'User ' + user._id + ' Joined',
            markdown.toHTML(mustache.render(data,user)),
            cb
        );
    });
}

function sendUserJoinedWelcomeEmail(user,cb) {
    fs.readFile(path.resolve(path.resolve(__dirname,'./email-templates/joined-user-email.md')), 'utf8', function(err,data) {
        if(err)
            return cb(err);

        sendSimpleEmail(
            'join@mail.pdfhummus.com',
            user.email,
            'Welcome to PDFHummus Services',
            markdown.toHTML(mustache.render(data,user)),
            cb
        );
    });
}

module.exports = {
	sendHelloEmail:sendHelloEmail,
    sendUserJoinedAdminEmail:sendUserJoinedAdminEmail,
    sendUserJoinedWelcomeEmail:sendUserJoinedWelcomeEmail

};