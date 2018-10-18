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
    res.render('login');
});

router.post('/', (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    const query = {
        where: { 
            name: username
        }
    };

    models.users.findOne(query).then((record) => {
        if(!record) {
            console.log('ユーザーが存在しない');
            res.status(500).render('login');
            return;
        }
        bcrypt.compare(password, record.getDataValue('password_hash'), (err, result) => {
            if(err) {
                console.log('なんらかのエラー');
                res.status(500).render('login');
                return;
            }

            if(!result) {
                console.log('パスワードが違う');
                res.status(500).render('login');
                return;
            }

            console.log('ログイン成功');
            req.session.user = record;
            res.redirect(`/users/${record.getDataValue('name')}`);
            return;
        });
    }).catch((err) => {
        console.log('DB select error');
        console.log(err);
        res.status(500).render('login');
        return;
    });
});

module.exports = router;
