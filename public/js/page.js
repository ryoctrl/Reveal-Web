function fadeout(element) {
    let interval = setInterval(function() {
        let opacity = element.style.opacity || element.style.MozOpacity || element.style.filter;
        if(opacity == 0) {
            clearInterval(interval);
            return;
        }
        if(typeof(opacity) === 'number') {
            console.log('opacity decrementing');
            opacity--;
        } else {
            opacity = opacity.split('=')[1];
            opacity--;
        }
        element.style.opacity = opacity;
        element.style.MozOpacity = opacity;
        element.style.filter = 'alpha(opacity=' + opacity + ')';
    }, 100);
}
window.addEventListener('load', function() {
    setTimeout(function() {
        console.log('start fade out messages');
        let messages = document.getElementsByClassName('messages');
        for(let message of messages) {
            message.parentNode.removeChild(message);
            //message.style.opacity = 100;
            //message.style.MozPoacity = 100;
            //message.style.filter = 'alpha(opacity=100)';
            //fadeout(message);
        }

    }, 2500);

});
