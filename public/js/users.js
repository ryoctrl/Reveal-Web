function othersClick() {
    let menu = document.getElementById('header-menu');
    let menuDisplay = menu.style.display;
    if(menuDisplay != 'none') menuDisplay = 'none';
    menu.style.display = menuDisplay;
}

function openPDF(user) {
    alertify.prompt().setContent(`<div style="text-align: left;"><h4>スライド形式</h4>
<p>ページ遷移後以下の手順でスライドをそのままPDFに出力できます</p>
<p>(Chromeのみ使用できる機能です)</p>
<p>1. Ctrl (Mac: Command) + P で印刷設定を開く</p>
<p>2. 送信先を「PDFに保存」に変更</p>
<p>3. レイアウトを「横」に変更</p>
<p>4. 余白を「なし」に変更</p>
<p>5. オプションの「背景のグラフィック」をONに</p>
<p>6. 「保存」をクリック</p>
<h4>書類形式</h4>
<p>スライドの内容をmarkdownレイアウトの形式で出力します</p></div>`)
        .setting({
            'onok': function() {
                window.open(user + '/slide?print-pdf');
            },
            'oncancel': function() {
                window.open(user + '/download/pdf');
            }
        }).set({labels:{ok: 'スライド形式', cancel: '書類形式'}}).setHeader('PDF出力').show();
}

window.addEventListener('load', function() {                
    document.getElementById('body-contents').addEventListener('click', othersClick);
    document.getElementsByTagName('iframe')[0].contentDocument.body.addEventListener('click', othersClick);
    //document.getElementById('header-contents').addEventListener('click', othersClick);
    let accountMenuButton = document.getElementById('account-menu-btn');
    accountMenuButton.addEventListener('click', function() {
            let menu = document.getElementById('header-menu');
            let menuDisplay = menu.style.display;
            if(menuDisplay === 'none') {
                menuDisplay = 'block';
            } else {
                menuDisplay = 'none';
            }
            menu.style.display = menuDisplay;
    });
});
