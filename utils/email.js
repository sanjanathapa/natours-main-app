const nodemailer = require('nodemailer');

const sendEmail = async options => {
    console.log("======================================")
    // 1.) create a Transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    //2.) define the email options
    const mailOptions = {
        from: 'Sanjana Thapa <hello@sanjana.io',
        to: options.email,
        subject: options.subject,
        text: options.message,
        //html:
    }

    //3.) Actually send the email
    transporter.sendMail(mailOptions);  //this actually returns a promise
}

module.exports = sendEmail