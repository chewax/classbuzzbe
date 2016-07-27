$("#loginForm").submit(function(event){
    event.preventDefault();

    var data = {
        username: $("#username").val(),
        password: $("#password").val()
    };

    var posting = $.post('/api/v1/authenticate', data);
    posting.done(function(result) {
        if (result.token !== undefined) {
            localStorage.setItem("griffin_data", JSON.stringify(result));
            window.location.replace("/api/v1/feed");
        }
    });
})
