var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    let sessionMessages = req.session.messages || [];
    let messages = [];
    while(sessionMessages.length > 0) {
        let message = sessionMessages.shift();
        messages.push(message);
    }     
    let obj = {
        messages: JSON.stringify(messages)
    };

    if(req.session.user)  obj.username = req.session.user.name;
    else obj.username = false;
    res.render('index', obj);
    return;
});

module.exports = router;
