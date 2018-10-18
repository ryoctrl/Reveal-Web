const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const models = require('../models');

router.get('/', (req, res, next) => {
    res.render('signup');
});

router.post('/', (req, res, next) => {
    const name = req.body.username;
    let password = req.body.password;
    const email = req.body.email;
    if(!name || !password || !email) {
        res.status(500).end('input value error');
        return;
    }


    ///checking user
    const mailQuery = {
        email: email
    };

    const nameQuery = {
        name: name
    };

    let findEmail = false;
    let findUser = false;
    models.users.findOne(mailQuery).then(record => {
        if(record) findEmail = true;
    }).then(() => {
        models.users.findOne(mailQuery).then(record => {
            if(record) findUser = true;

            if(findEmail || findUser) {
                res.redirect('/signup');
                return;
            }


            bcrypt.hash(password, 10, function(err, hash) {
                const userObj = {
                    name: name,
                    email: email,
                    password_hash: hash
                };

                models.users.create(userObj)
                    .then((record) => {
                        res.redirect('login');
                        return;
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(500).render('signup');
                        return;
                    });
            });
        });
    });
});


module.exports = router;
