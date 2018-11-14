function displayUploader() {
    //alertify.uploader();
    alertify.prompt('画像を挿入',
        'アップロードする画像を選択してください',
    ).setContent(`
        <div id="res-header" >
        <div class="res-col">サムネイル</div>
        <div class="res-col">ファイル名</div>
        <div class="res-col">挿入</div>
        <div class="res-col">削除</div>
        </div>
        <div id="res-contents">
        </div>
        <input id="resource" type="file" name="resource">
        <button class="button" onClick="postResource()" value="upload">Upload</button>
    `).setHeader('画像の挿入').show();

    let contents = document.getElementById('res-contents');
    let fields = ['thumb', 'name', /*'path',*/ 'insert', 'del'];
    resources.reverse();
    for(let res of resources) {
        let content = document.createElement('div');
        content.className = 'res-content';
        for(let col of fields) {
            let colContent = document.createElement('div');
            colContent.className = 'res-col';
            if(col === 'thumb') {
                colContent.style.textAlign = 'center';
                colContent.innerHTML = '<img src="' + res['path'] + '"></img">';
            } else if(col === 'insert') {
                colContent.innerHTML = `<button id="insert" style="margin: 0 auto;" onClick="insertResource('${res['path']}');">insert</button>`;
            } else if(col === 'del') {
                colContent.innerHTML = '<img class="del-button" id="'+res['path']+'" src="/del-icon.png"></img>';
                colContent.addEventListener('click', deleteResource);
            } else {
                colContent.innerHTML = '<p style="text-align: center; word-wrap: break-word;">' + res[col] + '</p>';
            }
            content.appendChild(colContent);
        }
        contents.appendChild(content);
    }
    resources.reverse();
}

function deleteResource(e) {
    let id = e.path[0].id;
    if(id == "" || !id.startsWith('uploads')) return;
    alertify.confirm('Confirm', '削除してよろしいですか?',
        function() {
            let data = {id: id};
            axios.post('/upload/delete', data)
                .then((res) => {
                    if(res.status != 200) return;
                    console.log(res);
                    for(let i in resources) {
                        if(resources[i].path === id) resources.splice(i, 1);
                    }
                    displayUploader();
                    alertify.success('データを削除しました');
                })
                .catch((err) => {
                    alertify.error('削除に失敗しました:' + err);
                });
        },
        function() {});
    }

function postResource() {
    let params = new FormData();
    let inputElem = document.getElementById('resource');
    params.append('resource', inputElem.files[0]);
    axios.post('/upload/resources', params)
        .then((res) => {
            let data = res.data;
            this.resources.push(data);
            //insertResource(data.path);
            displayUploader();
            alertify.success('アップロードに成功しました');
        })
        .catch((err) => {
            let msg = `アップロードに失敗しました.
${err}`;
            alertify.error(msg);
        });
}

function insertResource(path) {
    insertString('![](' + path + ')');
}

function insertString(str) {
    let textarea = document.getElementById('input');
    let sentence = textarea.value;
    let length = sentence.length;
    let position = textarea.selectionStart;

    let before = sentence.substr(0, position);
    let after = sentence.substr(position, length);
    sentence = before + str + after;
    textarea.value = sentence;

    if(!this.vuemd) return; 
    //TODO: vueのcustom directiveで対応させたい
    let e = document.createEvent('HTMLEVents');
    e.initEvent('input', false, true);
    textarea.dispatchEvent(e);
}

function displayMovie() {
    alertify.prompt('動画を挿入', '挿入する動画のIDを入力してください',
        'bM7SZ5SBzyY 又は sm99999999',
        function(evt, value) {
            let str = "";
            if(value.startsWith('sm')) {
                //niconico
                 str = '<iframe src="//embed.nicovideo.jp/watch/' + value + '?referer=//revealweb.mosin.jp"></iframe>';
           } else {
                //youtube
                str = '<iframe src="//www.youtube.com/embed/' + value + '?origin=//revealweb.mosin.jp"></iframe>';
            }
            insertString(str);
            alertify.success('動画を挿入しました');
        },
        function() {});
}

var fragmentsAlert;

function displayFragments() {
    fragmentsAlert = alertify.alert().setContent(generateButtonsOfFragments()).setHeader('効果文字を挿入').show();
}

function generateButtonsOfFragments() {
    let fragments = ['grow', 'shring', 'fade-out', 'fade-up', 'fade-in-then-out', 'fade-in-then-semi-out', 'highlight-current-blue', 'highlight-red', 'highlight-green', 'highlight-blue'];
    let str = "<p>スライドに様々な効果を持った文字を挿入することができます</p>";
    let count = 0;
    for(let frag of fragments) {
        let needSpace = count % 2 === 0;
        if(needSpace) str += '<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">';
        str += '<button class="button" style="font-size: 18px;" onClick="insertFragments(\'' + frag + '\');">' + frag + '</button>';
        if(!needSpace) str += '</div>';
        count++;
    }
    return str;
}

function insertFragments(frag) {
    insertTag('<p class="fragment ' + frag + '">', '</p>');
    fragmentsAlert.close();
}

function insertTag(open, close) {
    let textarea = document.getElementById('input');
    let sentence = textarea.value;
    let length = sentence.length;
    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;

    let before = sentence.substr(0, start);
    let target = sentence.substr(start, end - start);
    let after = sentence.substr(end, length);
    sentence = before + open + target + close + after;
    textarea.value = sentence;

    if(!this.vuemd) return; 
    //TODO: vueのcustom directiveで対応させたい
    let e = document.createEvent('HTMLEVents');
    e.initEvent('input', false, true);
    textarea.dispatchEvent(e);
}

function insertNote() {
    insertString(`<aside class="notes">

</alide>`);
}



let cssDatas = ['localName', 'className', 'innerText'];
function displayElements(path) {
    console.log(path);
    let out = document.getElementById('css-contents');
    while(out.firstChild) out.removeChild(out.firstChild);


    for(let p of path) {
        if(p.localName === 'body') break;
        let dataDiv = document.createElement('div');
        dataDiv.className = 'css-data';
        for(let cd of cssDatas) {
            let cdDiv = document.createElement('div');
            let cdP = document.createElement('p');
            let content = document.createTextNode(p[cd]);
            cdP.appendChild(content);
            cdDiv.appendChild(cdP);
            cdDiv.className = 'css-col';
            dataDiv.appendChild(cdDiv);
        }
        out.appendChild(dataDiv);
    }
}

function displayHelp(isCSS) {
    let message = '';
    let title = '';
    if(!isCSS) {
        message += `<h2>スライド操作</h2>
<p>・markdownのコンテンツの間に「___」(アンダースコア3回)の行を挿入することで縦方向のスライドを作成できます。</p>
<p>・markdownのコンテンツの間に「---」(ハイフン3回)の行を挿入することで横方向のスライドを作成できます。</p>`;
        title = 'マークダウンエディタのヘルプ';
    } else {
        message += `<h2>要素確認機能</h2>
<p>スライドプレビューをクリックすると、クリックした部分の要素の詳細(タグ名,クラス名,内容)が表示されます。</p>
<p>CSSを編集するのに役立ちます。</p>`
        title = 'CSSエディタのヘルプ';
    }
    message += `<h2>キーバインド</h2>
<p>・Tabキーでインデントを作成できます。</p>
<p>・Ctrl+Sで保存のキーバインドが使用できます。</p>
<p>(ブラウザによっては動作しない可能性があります。)</p>`;


alertify.alert().setContent(message).setHeader(title).show();

}
