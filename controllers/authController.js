const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const uc = require('./userController');
const sc = require('./sessionController');
const bcrypt = require('bcrypt');

module.exports = { 
    initialize: function(app) {
        this.app = app;
        this.authSettings = JSON.parse(process.env.AUTH);

        app.use(passport.initialize());
        app.use(passport.session());
        passport.serializeUser(uc.userSerialize);
        passport.deserializeUser(uc.userDeserialize);

        this.localActivate();
        this.twitterActivate();
        this.facebookActivate();
    },
    localActivate: function() {
        if(!this.authSettings.local.active) {
            console.log('Local Auth is not activated');
            return;
        }

        passport.use(new LocalStrategy(uc.localAuth));
        this.app.post('/login', async function(req, res, next) {
            await passport.authenticate('local', async function(err, user, info) {
                if(err) { 
                    let obj = {
                        message: info.message
                    };
                    res.status(500);
                    res.end(JSON.stringify(obj));
                    return;
                }

                if(!user) {
                    let obj = {
                        message: info.message
                    };
                    res.status(500);
                    res.end(JSON.stringify(obj));
                    return;
                }

                await req.logIn(user, async function(err) {
                    console.log('login');
                    if(err) {
                        let obj = {
                            message: info.message
                        };
                        res.status(500);
                        res.end(JSON.stringify(obj));
                        return;
                    }
                    let uid = req.session.passport.user;
                    req.session.user = await uc.findOneById(uid);
                    res.status(200);
                    res.end();
                    return;
                });
            })(req, res, null);
        });
        console.log('Local Auth is activeted');
    },
    twitterActivate: function() {
        if(!this.authSettings.twitter.active) {
            console.log('Twitter Auth is not activated');
            return;
        }
        let consumerKey = this.authSettings.twitter.TWITTER_CONSUMER_KEY;
        let consumerSecret = this.authSettings.twitter.TWITTER_CONSUMER_SECRET;
        passport.use(new TwitterStrategy({
            consumerKey: consumerKey,
            consumerSecret: consumerSecret,
            callbackURL: 'https://revealweb.mosin.jp/auth/twitter/callback'
        }, uc.twitterAuth));

        this.app.get('/auth/twitter', passport.authenticate('twitter'));
        this.app.get('/auth/twitter/callback', passport.authenticate('twitter'), async function(req, res) {
            let uid = req.session.passport.user;
            req.session.user = await uc.findOneById(uid);
            res.redirect(`/users/${uid}`);
        });
        console.log('Twitter Auth is activated');
    },
    facebookActivate: function() {

    },
    checkPassword: bcrypt.compare,
}
