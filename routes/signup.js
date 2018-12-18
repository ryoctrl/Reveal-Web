const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const models = require('../models');
const confirmer = require('../controllers/confirmController');
const userController = require('../controllers/userController');
const sessionController = require('../controllers/sessionController');

router.get('/', (req, res, next) => {
    res.redirect('/');
    return;

    /*
    let user = req.session.user;
    if(user) {
        res.redirect(`/users/${user.name}`);
        return;
    }

    const obj = {
        msg: req.session.msg
    };
    res.render('signup', obj);
    */
});

router.post('/', async (req, res, next) => {
    //TODO: メール機能を正常に動作させる。
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

    if(password != passwordConf) {
        sessionController.addError(req, '入力されたパスワードと確認用パスワードが異なります');
        res.redirect('/');
        return;
    }
    
    let query = {
        where: {
            email: email
        }
    };

    let record = await models.users.findOne(query);

    if(record) {
        sessionController.addError(req, '既に登録されているメールアドレスです');
        res.redirect('/');
        return;
    }

    query = {
        where: {
            name: name
        }
    };

    record = await models.users.findOne(query);

    if(record) {
        sessionController.addError(req, '既に登録されているユーザー名です');
        res.redirect('/');
        return;
    }

    bcrypt.hash(password, 10, async (err, hash) => {
        const userObj = {
            name: name,
            email: email,
            password_hash: hash,
            provider: 'original',
            activate_hash: confirmer.generateConfirmSeed(name, new Date()),
            activated: false
        };
        console.log(userObj);

        let record = await models.users.create(userObj).catch((err) => {
            console.log(err);
            sessionController.addError(req, 'なんらかのエラーが発生しました.もう一度登録を行ってください');
            res.redirect('/');
            return;
        });

        if(!record) {
            sessionController.addError(req, 'なんらかのエラーが発生しました.もう一度登録を行ってください');
            res.redirect('/');
            return;
        }


        confirmer.sendConfirm(record, function (err, result) {
            if(err) {
                sessionController.addError(req, '確認メール送信に失敗しました.管理者に問い合わせてください');
            } else {
                sessionController.addSuccess(req, '確認メールを送信しました');
            }            
            res.redirect('/');
        });
    });
});


module.exports = router;
