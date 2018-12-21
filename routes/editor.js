var express = require('express');
var router = express.Router();
const models = require('../models');
const fs = require('fs');
let url = process.env.USE_SSL ? 'https://' : 'http://';
url += process.env.HOST_NAME;
url += url.endsWith('/') ? '' : '/';


/* GET home page. */
router.get('/', async function(req, res, next) {
    let user = req.session.user;
    if(!user) {
        res.redirect('/');
        return;
    }

    let query = {
        where: {
            user_id: user.id
        }
    };

    let slide = await models.slides.findOne(query);
    if(!slide) {
        res.redirect(`/users/${user.name}`);
        return;
    }
    let markdownPath = slide.getDataValue('markdown_path');
    //toString()しなくてもlog出力では確認できたけどreplaceが使えなかった
    let markdownString = fs.readFileSync(markdownPath).toString();

    //リソースファイル系（画像等)
    let resourceRecords = await models.resources.findAll(query);
    let resources = [];
    for(let rec of resourceRecords) {
        resources.push({
            name: rec.getDataValue('name'),
            path: rec.getDataValue('path')
        });
    }

    //clientのvueオブジェクトに渡す際にテンプレートエンジンでレンダリングしなければならないので色々replace。
    //レンダリングしなくても直接vueに渡せる手法があるのであればそっちのがいい。
    //express-vueとかそれっぽい？
    markdownString = markdownString.replace(new RegExp('`', 'g'), '\\`');
    //これもレンダリング時に</script>を読むとそこでclientのscriptが終わってしまうので苦肉の策。
    markdownString = markdownString.replace(new RegExp('</script>', 'g'), '<//script>');

    let obj = {
        data: markdownString,
        resources: JSON.stringify(resources),
        isCSS: false,
        name: user.name,
        host: url
    };
    res.render('editor', obj);
});

router.post('/', async function(req, res, next) {
    let user = req.session.user;
    if(!user) {
        res.status(403);
        res.send('user not loggined');
        return;
    }

    let input = req.body.input;
    let username = user.id;

    let query = {
        where: {
            user_id: user.id
        }
    };

    let slide = await models.slides.findOne(query);
    let markdownPath = slide.getDataValue('markdown_path');
    fs.writeFile(markdownPath, input, (err) => {
        if(err) {
            res.status(500);
            res.send(err);
        }
        res.status(200);
        res.send();
    });
});

/*カスタムCSS*/
router.get('/ccss', async function(req, res, next) {
    let user = req.session.user;
    if(!user) {
        res.redirect('/');
        return;
    }

    let query = {
        where: {
            user_id: user.id
        }
    };

    let slide = await models.slides.findOne(query);
    if(!slide) {
        res.redirect(`/users/${user.name}`);
        return;
    }

    let cssPath = slide.getDataValue('css') || 'NOCSS';
    if(cssPath === 'NOCSS') {
        res.status(404);
        res.redirect(`/users/${user.name}`);
        return;
    }
    let cssString = fs.readFileSync(cssPath).toString();

    //clientのvueオブジェクトに渡す際にテンプレートエンジンでレンダリングしなければならないので色々replace。
    //レンダリングしなくても直接vueに渡せる手法があるのであればそっちのがいい。
    //express-vueとかそれっぽい？
    cssString = cssString.replace(new RegExp('`', 'g'), '\\`');
    

    let obj = {
        data: cssString,
        resources: [],
        isCSS: true,
        name: user.name
    };
    res.render('editor', obj);
});

router.post('/ccss', async function(req, res, next) {
    let user = req.session.user;
    if(!user) {
        res.status(403);
        res.send('user not loggined');
        return;
    }

    let input = req.body.input;
    let username = user.id;

    let query = {
        where: {
            user_id: user.id
        }
    };

    let slide = await models.slides.findOne(query);
    let cssPath = slide.css;
    if(!cssPath) {
        res.status(404);
        res.end('css does not exists');
        return;
    }
    fs.writeFile(cssPath, input, (err) => {
        if(err) {
            res.status(500);
            res.send(err);
            return;
        }
        res.status(200);
        res.send();
    });
});


module.exports = router;
