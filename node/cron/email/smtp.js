/**
 * the smtp lib, we use in our project, maybe you will use somewhere
 */

var nodemailer = require("nodemailer");

exports.sendmail = function(opt) {
    // create reusable transport method (opens pool of SMTP connections)
    var smtpTransport = nodemailer.createTransport("SMTP",{
        host: "example@example.com", // hostname
        secureConnection: false, // 
        port: 587, // 
        auth: {
            user: "example@example.com",
            pass: "password"
        }
    });

    var mailOptions = {
        from: "example@example.com", // sender address
        to: opt.addrs, // list of receivers
        subject: opt.subject, // Subject line
        text: opt.text ? opt.text : '', // plaintext body
        html: opt.html ? opt.html : '', // html body
        attachments: opt.attachments
    }

    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
            if (opt.fail && typeof(opt.fail) === "function") {
                opt.fail();
            }
        }else{
            console.log("Message sent: " + response.message);
            if (opt.succ && typeof(opt.succ) === "function") {
                opt.succ();
            }
        }

        // if you don't want to use this transport object anymore, uncomment following line
        smtpTransport.close(); // shut down the connection pool, no more messages
    });
};

