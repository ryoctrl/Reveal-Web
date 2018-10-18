const express = require('express');
const fs = require('fs');
const router = express.Router();
const request = require('request');
const reveal = require('../controllers/revealgo.js').reveal;
const models = require('../models');

//ユーザーの個人ページ
//processesにレコードがあればスライドへのリンクを表示する
router.get('/:name', (req, res, next) => {
    let user = req.session.user;
    let requestName = req.params.name;
    if(!user) {
        res.redirect('/login');
        return;
    }

    if(user.name != requestName) {
        res.redirect(`/users/${user.name}`);
        return;
    }

    let obj = {
        username: user.name,
        slide: false
    };

    const query = {
        where: {
            user_id: user.id
        }
    };

    models.processes.findOne(query).then((process) => {
        models.slides.findOne(query).then((slide) => {
            if(process && slide) {
                obj.slide = true;
                reveal.runIfNeeded(slide.getDataValue('markdown_path'), process.getDataValue('port'));
            }
            res.status(200).render('users', obj);
            return;
        });
    });
});

//ユーザー用のスライドページ
//RevealGoプロセスのポートへproxyする。
router.get('/:name/slide', (req, res, next) => {
    let user = req.session.user;
    let requestName = req.params.name;
    if(!user) {
        res.redirect('/login');
        return;
    }

    if(user.name != requestName) {
        res.redirect(`/users/${user.name}`);
        return;
    }

    const query = {
        where: {
            user_id: user.id
        }
    };

    models.processes.findOne(query).then(record => {
        let port = record.getDataValue('port');
        let url = 'http://127.0.0.1:' + port;
        request({
            url: url,
            method: 'GET',
        }).pipe(res);
        return;
    });
});

//RevealGoへアクセスした後にリソースとしてcss等のファイルにアクセスしに来る
router.get('/:name/revealjs/*', (req, res, next) => {
    let user = req.session.user;
    if(!user) {
        res.redirect(`/users/${user.name}`);
        return;
    }
    const query = {
        where: {
            user_id: user.id
        }
    };
    models.processes.findOne(query).then(record => {
        let reqPath = req.originalUrl;
        reqPath = reqPath.split(user.name)[1];
        let url = 'http://127.0.0.1:' + record.getDataValue('port') + reqPath;
        request({
            url: url,
            method: 'GET'
        }).pipe(res);
        return;
    }).catch(err => {
        console.log(err);

    });
});

//RevealGoへアクセスした後にリソースとしてmarkdownファイルにアクセスしに来る
router.get('/:name/uploads/*', (req, res, next) => {
    let user = req.session.user;
    if(!user) {
        console.log('returning redirect');
        res.redirect(`/users/${user.name}`);
        return;
    }

    let f = req.originalUrl.split(user.name)[1];
    f = f.substr(1);

    fs.createReadStream(f).once('open', function() {
        this.pipe(res);
    });
});


module.exports = router;
