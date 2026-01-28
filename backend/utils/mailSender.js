// const nodemailer = require ('nodemailer')
import nodemailer from 'nodemailer'

// const transporter = nodemailer.transporter(
//     {
//         host : "smitraichura2@gmail.com",
//         port : 465,
//         secure : "true",
//         auth: {
//             user : "jeeldobariy33@gmail.com",
//             pass : "ijyooxwmdzcxrzuf"
//         }
//     }    
// )

// const mailoptions = {
//     from : "smitraichura2@gmail.com",
//     to : mail.to,
//     sub : "email verified",
//     html : "this is the verification email"
// }

export  const sendMailer = async (mail) => {
    const transporter = nodemailer.createTransport(
    {
        host : "smtp.gmail.com",
        port : 465,
        secure : "true",
        auth: {
            user : "smitraichura2@gmail.com",
            pass : "ijyooxwmdzcxrzuf"
        }
    })

    const mailoptions = {
    from : "smitraichura2@gmail.com",
    // to : "jeeldobariy33@gmail.com",
    to: mail.to,
    // subject : "email verified",
    subject : mail.subject,
    // html : "this is the verification email"
    html : mail.html
}   


console.log("message sent");

const info = await transporter.sendMail(mailoptions);
console.log(info);

}




