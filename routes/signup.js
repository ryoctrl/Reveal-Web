const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const models = require('../models');

router.get('/', (req, res, next) => {
    res.render('signup');
});

router.post('/', async (req, res, next) => {
    const name = req.body.username;
    let password = req.body.password;
    const email = req.body.email;
    if(!name || !password || !email) {
        res.status(500).end('input value error');
        return;
    }

    let query = {
        where: {
            email: email
        }
    };

    let record = await models.users.findOne(query);

    if(record) {
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
            res.status(500).render('signup');
            return;
        });

        if(!record) return;

        res.redirect('login');
    });
});


module.exports = router;
