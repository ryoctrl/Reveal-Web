var template, form;
window.addEventListener('load', function() {
    document.getElementById('login-button').addEventListener('click', openLoginFields);
    document.getElementById('signup-button').addEventListener('click', openSignupFields);
    template = document.getElementsByTagName('template')[0];
    form = document.importNode(template.content, true);
});

function openLoginFields() {
    alertify.genericDialog(form.getElementById('loginForm'))
        .set('selector', 'input[name="username"]')
        .set('title', 'Login');
}

function openSignupFields() {
    alertify.genericDialog(form.getElementById('signupForm'))
        .set('selector', 'input[name="username"]')
        .setHeader('Signup');
}

function login() {
    let username = $('#username-input').val();
    post('login', function(res) {
        location.href = '/users/' + username;
    });
}

function signup() {
    post('signup', function(res) {
        alertify.success('アカウントの作成が完了しました.登録した情報でログインしてください');
        openLoginFields();
    });
}

function post(act, succeeded) {
    let username = $('#username-input').val();
    let password = $('#password-input').val();
    axios.post('/' + act, {
        username: username,
        password: password
    }).then((res) => {
        succeeded(res);
    }).catch((err) => {
        alertify.error(err.response.data);
    });
}
