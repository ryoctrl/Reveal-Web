const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const models = require('../models');
const mailer = require('../utils/mailer');
const userController = require('../controllers/userController');

router.get('/', (req, res, next) => {
    let user = req.session.user;
    if(user) {
        res.redirect(`/users/${user.name}`);
        return;
    }

    const obj = {
        msg: req.session.msg
    };
    res.render('signup', obj);
});

router.post('/', async (req, res, next) => {
    //TODO: メール機能を正常に動作させる。
    if(!req.session.msg) req.session.msg = {};
    const name = req.body.username;
    let password = req.body.password;
    //const email = req.body.email || "NoMail";
    if(!name || !password) {
    //if(!name || !password || !email) {
        //req.session.msg.signup = ["ユーザー名, パスワード, メールアドレス全て入力してください"];
        req.session.msg.signup = ['ユーザー名, パスワード共に入力してください'];
        res.redirect('/signup');
        return;
    }

    /*
    let query = {
        where: {
            email: email
        }
    };

    let record = await models.users.findOne(query);

    if(record) {
        req.session.msg.signup = ["既に登録されているユーザー名またはメールアドレスです"];
        res.redirect('/signup');
        return;
    }
    */

    query = {
        where: {
            name: name
        }
    };

    record = await models.users.findOne(query);

    if(record) {
        req.session.msg.signup = ["既に登録されているユーザー名またはメールアドレスです"];
        res.redirect('/signup');
        return;
    }


    bcrypt.hash(password, 10, async (err, hash) => {
        const userObj = {
            name: name,
            email: "NoMail",
            password_hash: hash
        };

        let record = await models.users.create(userObj).catch((err) => {
            console.log(err);
            req.session.msg.signup = ["なんらかのエラーが発生しました。もう一度登録を行ってください"];
            res.redirect('/signup');
            return;
        });

        if(!record) {
            req.session.msg.signup = ["なんらかのエラーが発生しました。もう一度登録を行ってください"];
            res.redirect('/signup');
            return;
        }

        req.session.msg.login = [];
        req.session.msg.login.push('登録したアカウント情報でログインしてください');
        res.redirect('login');

        /*
        mailer.sendConfirm(email, function (err, result) {
            req.session.msg.login = [];
            if(err) req.session.msg.login.push('確認メールの送信時に何らかのエラーが発生しました。');
            else req.session.msg.login.push('確認メールを送信しました。');
            res.redirect('login');
        });
        */
    });
});


module.exports = router;
