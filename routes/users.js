const express = require('express');
const fs = require('fs');
const router = express.Router();
const request = require('request');
const reveal = require('../controllers/revealgo.js').reveal;
const models = require('../models');

//userSession: ログイン済みの場合ユーザー情報がある。
//これがnullである場合、アクセスユーザーは未ログイン状態。
//requestedUserName: このユーザーのスライドをリクエストされている。
//このユーザーのスライド設定が共有設定になっている場合userSessionに関わらず表示する
const getAccessProcess = async (userSession, requestedUserName) => {
    if(!requestedUserName) return false;

    let userQuery = {
        where: {
            name: requestedUserName
        }
    };

    let requestedUser = await models.users.findOne(userQuery);

    if(!requestedUser) return false;

    let requestedUserId = requestedUser.getDataValue('id');

    let slideQuery = {
        where: {
            user_id: requestedUserId
        }
    };

    let slide = await models.slides.findOne(slideQuery);
    if(!slide) return false;

    let isOwnUser = false;
    if(userSession && 'name' in userSession) isOwnUser = userSession.name === requestedUserName;

    if(slide.getDataValue('shared') || isOwnUser) {
        return await models.processes.findOne(slideQuery);
    }
    return false;
}

const redirectToLogin = res => {
    res.redirect('/login');
}

router.get('/', (req, res, next) => { res.redirect('/login'); });

//ユーザーの個人ページ
//processesにレコードがあればスライドへのリンクを表示する
router.get('/:name', async (req, res, next) => {
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
        slide: false,
        msg: req.session.msg
    };

    const query = {
        where: {
            user_id: user.id
        }
    };

    let process = await models.processes.findOne(query);
    let slide = await models.slides.findOne(query);
    if(process && slide) {
        obj.slide = true;
        obj.shared = slide.getDataValue('shared');
        reveal.runIfNeeded(slide.getDataValue('markdown_path'), process.getDataValue('port'));
    }
    res.status(200).render('users', obj);
    req.session.msg.users = [];
    return;
});

router.get('/:name/changeShare', async (req, res, next) => {
    let user = req.session.user;
    if(!user) {
        redirectToLogin(res);
        return;
    }

    let slideQuery = {
        where: {
            user_id: user.id
        }
    };

    let slide = await models.slides.findOne(slideQuery);

    if(!slide) {
        res.redirect(`/users/${user.name}`);
        return;
    }

    let shared = slide.getDataValue('shared');
    
    let obj = {
        shared: !shared
    };

    slide.setDataValue('shared',!shared); 
    req.session.msg.users = [];
    models.slides.update(obj, slideQuery)
    .then((record) => {
        let msg = !shared ? "スライドを共有設定に変更しました" : "スライドを非共有設定に変更しました";
        req.session.msg.users.push(msg);
        res.redirect(`/users/${user.name}`);
    })
    .catch((err) => {
        let msg = 'スライドの共有設定変更に失敗しました';
        req.session.msg.users.push(msg);
        res.redirect(`/users/${user.name}`);
    });
});

//ユーザー用のスライドページ
//RevealGoプロセスのポートへproxyする。
router.get('/:name/slide', async (req, res, next) => {
    let sessionUser = req.session.user;
    let requestedUserName = req.params.name;

    let accessProcess = await getAccessProcess(sessionUser, requestedUserName); 

    if(accessProcess) {
        let port = accessProcess.getDataValue('port');
        let url = 'http://127.0.0.1:' + port;
        request({
            url: url,
            method: 'GET'
        }).pipe(res);
        return;
    } else {
        if(!req.session.msg) req.session.msg = {};
        req.session.msg.login = ['スライドにアクセスすることができませんでした。'];
        redirectToLogin(res);
        return;
    }
});

//RevealGoへアクセスした後にリソースとしてcss等のファイルにアクセスしに来る
router.get('/:name/revealjs/*', async (req, res, next) => {
    let sessionUser = req.session.user;
    let requestedUserName = req.params.name;

    let accessProcess = await getAccessProcess(sessionUser, requestedUserName);

    if(accessProcess) {
        let reqPath = req.originalUrl;
        reqPath = reqPath.split(requestedUserName)[1];
        let url = 'http://127.0.0.1:' + accessProcess.getDataValue('port') + reqPath;
        request({
            url: url,
            method: 'GET'
        }).pipe(res);
        return;
    } else {
        res.status(404).end();
    }
});

//RevealGoへアクセスした後にリソースとしてmarkdownファイルにアクセスしに来る
router.get('/:name/uploads/*', async(req, res, next) => {
    let sessionUser = req.session.user;
    let requestedUserName = req.params.name;

    let accessProcess = await getAccessProcess(sessionUser, requestedUserName);
    
    if(accessProcess) {
        let f = req.originalUrl.split(requestedUserName)[1];
        f = f.substr(1);

        fs.createReadStream(f).once('open', function() {
            this.pipe(res);
        });
        return;
    }

    res.redirect(`/users/${user.name}`);
    return;
});

module.exports = router;
