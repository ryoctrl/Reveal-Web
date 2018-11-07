const express = require('express');
const fs = require('fs');
const markdownpdf = require('markdown-pdf');
const router = express.Router();
const request = require('request');
const reveal = require('../controllers/revealgo.js').reveal;
const models = require('../models');
const ALLOW_DESIGNS = ['beige', 'black', 'blood', 'league', 'moon', 'night', 'serif', 'simple', 'sky', 'solarized', 'white'];
const ALLOW_MOTIONS = ["default", "cube", "page", "concave", "zoom", "linear", "fade", "none"];

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
        msg: req.session.msg,
        selectingDesign: "null",
        selectingMotion: "null",
        designs: ALLOW_DESIGNS,
        motions: ALLOW_MOTIONS
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
        obj.selectingDesign = slide.design;
        obj.selectingMotion = slide.motion;
        await reveal.runIfNeeded(slide, process);
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

    console.log('checkAccessProcess');
    let accessProcess = await getAccessProcess(sessionUser, requestedUserName); 
    console.log('ok access');

    if(accessProcess) {
        console.log('returning');
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

    //TODO: 本当にアクセス管理をするべきか検討する（アクセス管理が必要な場合現状多数のSQL問い合わせが必要になる)
    //let accessProcess = true;
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

router.post('/:name/design', async(req, res, next) => {
    let sessionUser = req.session.user;
    if(!sessionUser) {
        res.status(403);
        res.end();
        return;
    }
    let design = req.body.design;

    if(ALLOW_DESIGNS.indexOf(design) == -1) {
        res.status(500);
        res.end();
        return;
    }

    let query = {
        where: {
            user_id: sessionUser.id
        }
    };

    let slide = await models.slides.findOne(query);
    await slide.update({design: design});
    await reveal.rebootReveal(slide, await models.processes.findOne(query));

    res.status(200);
    res.end();
});

router.post('/:name/motion', async(req, res, next) => {
    let sessionUser = req.session.user;
    if(!sessionUser) {
        res.status(403);
        res.end();
        return;
    }

    let motion = req.body.motion;

    if(ALLOW_MOTIONS.indexOf(motion) == -1) {
        res.status(500);
        res.end();
        return;
    }

    let query = {
        where: {
            user_id: sessionUser.id
        }
    };

    let slide = await models.slides.findOne(query);
    await slide.update({motion: motion});
    await reveal.rebootReveal(slide, await models.processes.findOne(query));

    res.status(200);
    res.end();
});

router.get('/:name/download/md', async function(req, res, next) {
    let sessionUser = req.session.user;
    if(!sessionUser) {
        res.status(403);
        res.end();
        return;
    }


    let query = {
        where: {
            user_id: sessionUser.id
        }
    };
    let slide = await models.slides.findOne(query);
    if(!slide) {
        res.status(404);
        res.end();
        return;
    }

    let mdpath = slide.getDataValue('markdown_path');
    let filename = sessionUser.name + '.md';
    console.log(mdpath + " : " + filename);

    res.download(mdpath, filename);

});

router.get('/:name/download/pdf', async function(req, res, next) {
    let sessionUser = req.session.user;
    if(!sessionUser) {
        res.status(403);
        res.end();
        return;
    }


    let query = {
        where: {
            user_id: sessionUser.id
        }
    };
    let slide = await models.slides.findOne(query);
    if(!slide) {
        res.status(404);
        res.end();
        return;
    }

    let mdpath = slide.getDataValue('markdown_path');
    let filename = sessionUser.name + '.md';

    fs.createReadStream(mdpath).pipe(markdownpdf()).pipe(res);
});

module.exports = router;
