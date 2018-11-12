var express = require('express');
var router = express.Router();
const models = require('../models');
const fs = require('fs');

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
        name: user.name
    };
    res.render('editor', obj);
});

router.post('/', async function(req, res, next) {
    let user = req.session.user;
    if(!user) {
        console.log('not loggined');
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
    fs.writeFileSync(markdownPath, input);
    res.status(200);
});

module.exports = router;
