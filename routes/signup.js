const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const sessionController = require('../controllers/sessionController');

router.get('/', (req, res, next) => {
    res.redirect('/');
    return;
});

router.post('/', async (req, res, next) => {
    if(!req.session.messages) req.session.messages = [];
    const name = req.body.username;
    const password = req.body.password
    const passwordConf = req.body.password_conf;
    const email = req.body.email || "NoMail";
    if(!name || !email || !password || !passwordConf) {
        sessionController.addError(req, '全ての項目を入力してください');
        res.redirect('/');
        return;
    }

    let result = await userController.registerUser(name, email, password, passwordConf);
    if(result.error) {
        sessionController.addError(req, result.msg);
    } else {
        sessionController.addSuccess(req, result.msg);
    }
    res.redirect('/');
    return;
});


module.exports = router;
