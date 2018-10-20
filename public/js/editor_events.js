document.onkeydown = function(e) {
    if(event.ctrlKey) {
        if(event.keyCode == 83) {
            document.getElementById('save_button').click();
            event.keyCode = 0;
            return false;
        }
    }
}

document.onkeypress = function(e) {
    if(e != null) {
        if((e.ctrlKey || e.metaKey) && e.which == 115) {
            document.getElementById('save_button').click();
            return false;
        }
    }
} 

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('input').addEventListener('keydown', function(e) {
        var elem, end, start, value;
        if(e.keyCode === 9) {
            if(e.preventDefault) {
                e.preventDefault();
            }
            elem = e.target;
            start = elem.selectionStart;
            end = elem.selectionEnd;
            value = elem.value;
            elem.value = "" + (value.substring(0, start)) + "\t" + (value.substring(end));
            elem.selectionStart = elem.selectionEnd = start + 1;
            return false;
        }

    });
});
