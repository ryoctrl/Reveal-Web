window.onload = function() {
    document.getElementById('mdfile').addEventListener('change', function(e) {
        const files = e.target.files;
        let filename = "";
        const uploadBtn = document.getElementById('uploadbtn');
        if(files.length === 0) {
            filename = "ファイルを選択";
            uploadBtn.style.display = "none";
        } else {
            filename = files[0].name;
            uploadBtn.style.display = "";
        }

        document.getElementById('filebtn').innerText = filename;
        
        console.log(e.target.files);
    });

}

let selectFileClicked = function() {

    document.getElementById('mdfile').click();
};
