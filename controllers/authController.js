const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const uc = require('./userController');

module.exports = {
    initialize: function(app) {
        app.use(passport.initialize());
        app.use(passport.session());
        passport.serializeUser(uc.userSerialize);
        passport.deserializeUser(uc.userDeserialize);
        passport.use(new TwitterStrategy({
            consumerKey: process.env.TWITTER_CONSUMER_KEY,
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
            callbackURL: 'https://revealweb.mosin.jp/auth/twitter/callback'
        }, uc.userTwitterAuth));

        app.get('/auth/twitter', passport.authenticate('twitter'));
        app.get('/auth/twitter/callback', passport.authenticate('twitter'), async function(req, res) {
            let uid = req.session.passport.user;
            req.session.user = await uc.findOneById(uid);
            res.redirect(`/users/${uid}`);
        });
    }
}
