const express = require('express');
const router = express.Router();
const passport = require('passport');
const uc = require('../controllers/userController');

router.get('/auth/twitter', passport.authenticate('twitter'));
router.get('/auth/twitter/callback', passport.authenticate('twitter'), async function(req, res) {
    let uid = req.session.passport.user;
    req.session.user = await uc.findOneById(uid);
    res.redirect(`/users/${uid}`);
});

module.exports = router;
