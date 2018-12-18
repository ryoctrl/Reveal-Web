const models = require('../models');
const ac = require('./authController');
const bcrypt = require('bcrypt');
const moment = require('moment');

module.exports = {
    localAuth: async function(username, password, done) { 
        const query = {
            where: {
                name: username
            }
        };

        let record = await models.users.findOne(query).catch((err) => {
            done(err);
        });

        if(!record) {
            return done(null, false, { message: 'ユーザー名またはパスワードが違います' });
        }

        if(!record.activated) {
            return done(null, false, { message: 'アカウントがアクティベートされていません.メールを確認してください'});
        }

        bcrypt.compare(password, record.getDataValue('password_hash'), (err, result) => {
            if(err || !result) {
                return done(null, false, { message: 'ユーザー名又はパスワードが違います' });
            }

            return done(null, record);
        });
    },
    twitterAuth: async function(token, tokenSecret, profile, done) {
        let findQuery = {
            where: {
                provider: profile.provider,
                name: profile.username,
            }
        };

        let user = await models.users.findOne(findQuery);

        if(user) return done(null, profile);

        let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : 'NoMail';

        let newUserObject = {
            provider: profile.provider,
            name: profile.username,
            email: email,
            password_hash: 'none',
            activate_hash: 'None',
            activated: true
        };

        await models.users.create(newUserObject).catch((err) => {
            console.error(err);
            return done(null);
        });

        return done(null, profile);
    },
    userSerialize: async function(user, done) {
        let name = user.username || user.name;
        done(null, name);
    },
    userDeserialize: async function(id, done) {
        let query = {
            where: {
                id: id
            }
        };
        let user = await models.users.findOne(query);
        done(null, user);
    },
    findOneById: async function(uid) {
        let query = {
            where: {
                name: uid
            }
        };
        return await models.users.findOne(query);
    },
    activateUser: async function(hash) {
        let query = {
            where: {
                activate_hash: hash
            }
        };

        let record = await models.users.findOne(query).catch((err) => {
            return {
                err: true,
                message: err.toString()
            };
        });

        if(!record) {
            return {
                err: true,
                message: 'ユーザーが存在しません'
            };
        };

        let created = moment(record.created_at);
        let now = moment();
        console.log(created);
        console.log(now);
        console.log(now.diff(created, 'hours'));
        console.log(now.diff(created, 'seconds'));

        //TODO: add support for time limit process.
        //it needs function of resend email and reauthenticate flag.
        if(now.diff(created, 'hours') > 2) {
            await models.users.destroy(query);
            return {
                err: true,
                message: '認証の有効期限が切れています。アカウントを登録し直してください.'
            }
        }

        let obj = {
            activated: true
        };

        await models.users.update(obj, query);
        return {
            err: false
        };
    },
}
