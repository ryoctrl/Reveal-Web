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
    res.render('index', { messages: JSON.stringify(messages) });
    return;
});

module.exports = router;
