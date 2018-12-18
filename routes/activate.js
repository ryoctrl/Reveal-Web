var express = require('express');
var router = express.Router();
const uc = require('../controllers/userController');
const sc = require('../controllers/sessionController');

/* GET home page. */
router.get('/:hash', async function(req, res, next) {
    let hash = req.params.hash;
    let result = await uc.activateUser(hash);
    if(result.err) {
        sc.addError(req, result.message);
    } else {
        sc.addSuccess(req, 'ユーザーをアクティベートしました.登録した情報でログインしてください.');
    }
    res.redirect('/');
});

module.exports = router;
