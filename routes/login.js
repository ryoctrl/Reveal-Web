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
    }
    res.render('login', obj);
});

router.post('/', async (req, res, next) => {
    if(!req.session.msg) req.session.msg = {};
    const username = req.body.username;
    const password = req.body.password;

    const query = {
        where: { 
            name: username
        }
    };

    let record = await models.users.findOne(query).catch((err) => {
        console.log(err);
        req.session.msg.login = ["なんらかのエラーが発生しました。"];
        res.redirect('/login');
        return;
    });

    if(!record) {
        req.session.msg.login = ["ユーザー名またはパスワードが違います."];
        res.redirect('/login');
        return;
    }

    bcrypt.compare(password, record.getDataValue('password_hash'), (err, result) => {
        if(err || !result) {
            req.session.msg.login = ["ユーザー名またはパスワードが違います."];
            return;
        }

        req.session.user = record;
        res.redirect(`/users/${record.getDataValue('name')}`);
        return;
    });
});

module.exports = router;
