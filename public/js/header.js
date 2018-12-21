window.addEventListener('load', function() {
    let accountMenuButton = document.getElementById('account-menu-btn');
    accountMenuButton.addEventListener('click', function() {
        let menu = document.getElementById('header-menu');
        let menuDisplay = menu.style.display;
        if(menuDisplay === 'block') {
            menuDisplay = 'none';
        } else {
            menuDisplay = 'block';
        }
        menu.style.display = menuDisplay;
    });
});
