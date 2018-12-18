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
                    console.log('authenticate error!');
                    sc.addError(req, info.message);
                    return res.redirect('/');
                }

                if(!user) {
                    console.log('authenticate error!!')
                    sc.addError(req, info.message);
                    return res.redirect('/');
                }
                console.log('info xx');
                console.log(info);
                console.log('info yy');
                await req.logIn(user, async function(err) {
                    if(err) {
                        console.log('authenticate error!!!');
                        sc.addError(req, err.toString());
                        return res.redirect('/');
                    }
                    let uid = req.session.passport.user;
                    req.session.user = await uc.findOneById(uid);
                    console.log('redirect to ' +  '/users/' + user.name);
                    return res.redirect('/users/' + user.name);
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
