const models = require('../models');

module.exports = {
    userTwitterAuth: async function(token, tokenSecret, profile, done) {
        let findQuery = {
            where: {
                provider: profile.provider,
                name: profile.username,
            }
        };

        let user = await models.users.findOne(findQuery);

        if(user) return done(null, profile);

        console.log(profile);

        let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : 'NoMail';

        let newUserObject = {
            provider: profile.provider,
            name: profile.username,
            email: email,
            password_hash: 'none'
        };

        await models.users.create(newUserObject).catch((err) => {
            console.error(err);
            return done(null);
        });

        return done(null, profile);
    },
    userSerialize: async function(user, done) {
        let name = user.username;
        done(null, name);
    },
    userDeserialize: async function(id, done) {
        let query = {
            where: {
                id: id
            }
        };
        let user = await models.users.findOne(query);
        console.log('deserialize user');

        done(null, user);
    },
    findOneById: async function(uid) {
        let query = {
            where: {
                name: uid
            }
        };
        return await models.users.findOne(query);
    }
}
