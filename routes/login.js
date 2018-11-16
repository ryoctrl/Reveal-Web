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
        res.status(403);
        res.end('ユーザー名またはパスワードが違います');
        return;
    });

    if(!record) {
        res.status(403);
        res.end('ユーザー名またはパスワードが違います');
        return;
    }

    bcrypt.compare(password, record.getDataValue('password_hash'), (err, result) => {
        if(err || !result) {
            res.status(403);
            res.end('ユーザー名またはパスワードが違います');
            return;
        }

        req.session.user = record;
        res.status(200);
        res.end();
        return;
    });
});

module.exports = router;
