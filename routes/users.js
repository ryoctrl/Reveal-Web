const express = require('express');
const fs = require('fs');
const markdownpdf = require('markdown-pdf');
const router = express.Router();
const request = require('request');
const reveal = require('../controllers/revealgo.js').reveal;
const mc = require('../controllers/markdownController');
const models = require('../models');
const CUSTOM_CSS = 'CustomCSS';
const ALLOW_DESIGNS = ['beige', 'black', 'blood', 'league', 'moon', 'night', 'serif', 'simple', 'sky', 'solarized', 'white', CUSTOM_CSS];
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
    res.redirect('/');
}

router.get('/', (req, res, next) => { res.redirect('/login'); });

//ユーザーの個人ページ
//processesにレコードがあればスライドへのリンクを表示する
router.get('/:name', async (req, res, next) => {
    let user = req.session.user;
    let requestName = req.params.name;
    if(!user) {
        res.redirect('/');
        return;
    }

    if(user.name != requestName) {
        res.redirect(`/users/${user.name}`);
        return;
    }

    let sessionMessages = req.session.msg || [];
    let messages = [];
    while(sessionMessages.length > 0) messages.push(sessionMessages.shift());

    let obj = {
        username: user.name,
        slide: false,
        msg: messages,
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
        let obj = {
            msg: !shared ? 'スライドを共有設定に変更しました' : 'スライドを非共有設定に変更しました',
            label: !shared ? 'スライドを共有しない' : 'スライド共有'
        };
        res.status(200);
        res.end(JSON.stringify(obj));
    })
    .catch((err) => {
        let obj = {
            msg: 'スライドの共有設定変更に失敗しました'
        }
        res.status(500);
        res.end(JSON.stringify(obj));
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
        let port = accessProcess.getDataValue('port');
        let url = 'http://127.0.0.1:' + port;
        let reqOpt = {
            url: url,
            method: 'GET'
        };
        let req  = request(reqOpt);
        req.on('error', (e) => {
            res.status(500);
            res.end(e.toString());
        });
        req.pipe(res);
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
    let query = {
        where: {
            name: requestedUserName
        }
    };
    let user = await models.users.findOne(query);

    query.where = {
        user_id: user.id
    };
    let process = await models.processes.findOne(query);
    let reqPath = req.originalUrl;
    reqPath = reqPath.split(requestedUserName)[1];
    let url = 'http://127.0.0.1:' + process.port + reqPath;

    request({
        url: url,
        method: 'GET'
    }).on('error', function(err) {
        res.status(500);
        res.end(err.toString());
    }).pipe(res);
});

//RevealGoへアクセスした後にリソースとしてmarkdownファイルにアクセスしに来る
router.get('/:name/uploads/*', async(req, res, next) => {
    let sessionUser = req.session.user;
    let requestedUserName = req.params.name;

    let accessProcess = await getAccessProcess(sessionUser, requestedUserName);
    
    if(accessProcess) {
        let f = req.originalUrl.split(requestedUserName);
        if(req.originalUrl.endsWith('css') && f.length > 2){
            f = f[1] + requestedUserName  + f[2];
        } else {
            f = f[1];
        }

        f = f.substr(1);

        try {
            fs.statSync(f);
        } catch(e) {
            res.status(404);
            res.end(e.toString());
            return;
        }

        fs.createReadStream(f).once('open', function() {
                this.pipe(res);
        });
    } else {
        res.status(403).end();
    }
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
    let process = await models.processes.findOne(query);

    let updateObj = {
        design: design,
        css: null
    };

    let currentDesign = slide.design || 'NOCSS';

    if(currentDesign != CUSTOM_CSS && design === CUSTOM_CSS) {
        let cssPath = await reveal.generateCSS(slide, process, sessionUser.name);
        updateObj.css = cssPath;
    }
    await slide.update(updateObj);
    await reveal.rebootReveal(slide, process);

    res.status(200);
    res.end(`デザインを${design}に変更しました`);
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
    res.end(`モーションを${motion}に変更しました`);
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
    try {
        fs.statSync(mdPath);
    } catch(e) {
        res.status(404);
        res.end(e.toString());
        return;
    }
    let filename = sessionUser.name + '.md';

    fs.createReadStream(mdpath).pipe(markdownpdf()).pipe(res);
});

//RevealGoへアクセスした後にリソースとしてcss等のファイルにアクセスしに来る
router.get('/:name/slide/revealjs/*', async (req, res, next) => {
    let sessionUser = req.session.user;
    let requestedUserName = req.params.name;
    let query = {
        where: {
            name: requestedUserName
        }
    };
    let user = await models.users.findOne(query);

    query.where = {
        user_id: user.id
    };
    let process = await models.processes.findOne(query);
    let reqPath = req.originalUrl;
    reqPath = reqPath.split(requestedUserName)[1];
    let url = 'http://127.0.0.1:' + process.port + reqPath;

    request({
        url: url,
        method: 'GET'
    }).on('error', function(err) {
        res.status(500);
        res.end(err.toString());
    }).pipe(res);
});

//RevealGoへアクセスした後にリソースとしてmarkdownファイルにアクセスしに来る
router.get('/:name/slide/uploads/*', async(req, res, next) => {
    let sessionUser = req.session.user;
    let requestedUserName = req.params.name;

    let accessProcess = await getAccessProcess(sessionUser, requestedUserName);
    
    if(accessProcess) {
        let f = req.originalUrl.split(requestedUserName);
        if(req.originalUrl.endsWith('css') && f.length > 2){
            f = f[1] + requestedUserName  + f[2];
        } else {
            f = f[1];
        }

        f = f.split('slide')[1];
        f = f.substr(1);

        try {
            fs.statSync(f);
        } catch(e) {
            res.status(404);
            res.end(e.toString());
            return;
        }


        fs.createReadStream(f).on('error', (e) => {
            res.status(500);
            res.end(e.toString());
        }).once('open', function() {
            this.pipe(res);
        });
        return;
    } else {
        res.status(404).end();
    }
});

router.post('/:name/newmd', async (req, res, next) => {
    let sessionUser = req.session.user;
    let requestedUserName = req.params.name;
    console.log(sessionUser);

    if(!sessionUser) {
        res.redirect('/');
        return;
    }

    if(sessionUser.name != requestedUserName) {
        res.redirect('/');
        return;
    }

    let result = await mc.createNewSlide(sessionUser.id);

    if(result.err) {
        res.status(500);
        res.end();
        return;
    }

    reveal.runAsNewProcess(result.record, () => {
        res.redirect('');
        return;
    });
});

module.exports = router;
