const mailer = require('mailer');
const bcrypt = require('bcrypt');
let confirmMailOptions = {
    ssl: false,
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    domain: process.env.MAIL_DOMAIN,
    from: process.env.MAIL_FROM,
    subject: 'RevealWeb アカウントアクティベート',
};
let url = process.env.USE_SSL ? 'https://' : 'http://';
url += process.env.HOST_NAME;
url += url.endsWith('/') ? '' : '/';

module.exports = {
    send: (options, cb) => {
        mailer.send(confirmMailOptions, cb);
    },
    sendConfirm: function(record, cb) {
        if(!record.email) {
            throw new Error('User has not registered email');
            return;
        }

        let to = record.email;
        let hash = record.activate_hash;
        let activateURL = encodeURI(`${url}activate/${hash}`);

        confirmMailOptions.to = to;
        confirmMailOptions.html = `
            <p>RevealWebへの登録ありがとうございます。</p>
            <hr>
            <p><a href="${activateURL}">このリンクからアカウントをアクティベートしログインしてください</a></p>
            <p>※アクティベートアドレスの有効期限は２時間です.</p>
            <p>有効期限をすぎるとアカウントが削除されますため、再登録が必要になります.</p>
        `;
        this.send(confirmMailOptions, cb);
    },
    generateConfirmSeed: function(name, date) {
        const seed = name + date;
        const salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(seed, salt);
        hash = hash.replace(/\//g, "");
        return hash.toString();
    }
};
