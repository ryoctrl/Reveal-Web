const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const models = require('../models');

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
    delete res.session.msg.signup;
});

router.post('/', async (req, res, next) => {
    if(!req.session.msg) req.session.msg = {};
    const name = req.body.username;
    let password = req.body.password;
    const email = req.body.email;
    if(!name || !password || !email) {
        req.session.msg.signup = ["ユーザー名, パスワード, メールアドレス全て入力してください"];
        res.redirect('/signup');
        return;
    }

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
            email: email,
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


        res.redirect('login');
    });
});


module.exports = router;
