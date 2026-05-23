import nodemailer from 'nodemailer';

const t = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'nhoclay6969@gmail.com',
        pass: 'xswg jrue mytb odln'
    }
});

t.verify().then(() => console.log('OK')).catch(e => console.log('FAIL:', e.message));