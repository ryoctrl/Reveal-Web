const mailer = require('mailer');

let confirmMailOptions = {
    ssl: false,
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    domain: process.env.MAIL_DOMAIN,
    from: process.env.MAIL_FROM,
    subject: 'RevealWeb アカウントアクティベートメール',
}

function send(options, cb) {
    mailer.send(options, (err, result) => { cb(err, result); });
}

module.exports.sendConfirm = (to, cb) => {
    confirmMailOptions.to = to;
    confirmMailOptions.html = `
        RevealWebへの登録ありがとうございます。

        <a href="https://revealweb.mosin.jp/login">このリンクからアカウントをアクティベートしログインしてください</a>
    `;
    send(confirmMailOptions, cb);
}
