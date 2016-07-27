var socket = io();
var userData = JSON.parse(localStorage.getItem("griffin_data"));
var messageSide = "left";

socket.on('newEvent', function(event){
    loadNewEvent(event);
    refreshHouseScore(event.house);
});

socket.on('newquestavailable', function(newQuest){
    //New Quest
});

socket.on('newnotification', function(notification){
    //New Notification
});

$(document).ready(function(){

    populateFeed();
    populateHouses();

    if (userData !== undefined) {
        loadUserInfo();
        socket.emit("tieandjoin", userData.user.id, userData.user.customer);
    }

});


function refreshHouseScore(house){
    var selector = "#"+house._id;
    var $house = $(selector);

    selector += " #score";
    var $score = $(selector)[0];
    $score.innerHTML = house.score;

    selector = "#"+house._id;
    var $leadingHouse = $(selector).prev();

    if ($leadingHouse.length == 0) {
        return;
    }

    var $leadingScore = $leadingHouse.find("#score");
    var leadScore = $leadingScore[0].innerHTML;
    var thisScore = house.score;

    if (thisScore > leadScore) {
        $house.after($house.prev());
    }
}

function populateHouses(){
    var data = { customer: userData.user.customer };
    var apiEndopint = '/api/v1/houses/find/byCustomer';

    var headers = {
        Authorization: 'Bearer ' + userData.token,
        AppKey: "6c1398ae5bb01f52d3ae00bc6a683c3beb129959"
    }

    $.ajax({
        url: apiEndopint,
        method: 'POST',
        data: data,
        headers: headers,
        dataType: 'json'
    })
    .done(function(data){
        data.forEach(function(h){
            loadHouse(h);
        })
    })
}

function populateFeed(){

    var data = { customer: userData.user.customer };
    var apiEndopint = '/api/v1/events/find/byCustomer';
    var headers = {
        Authorization: 'Bearer ' + userData.token,
        AppKey: "6c1398ae5bb01f52d3ae00bc6a683c3beb129959"
    }

    $.ajax({
        url: apiEndopint,
        method: 'POST',
        data: data,
        headers: headers,
        dataType: 'json'
    })
    .done(function(data){
        for(var i = data.length-1; i>=0 ; i--) {
            loadNewEvent(data[i]);
        }
    })
}

function loadUserInfo() {
    $("#userProfileName").text(userData.user.firstName +" "+ userData.user.lastName);
    $("#userProfileEmail").text(userData.user.email);
}

function loadHouse(house){
    var houseContainer = $(".users-list")[0];

    var newHouse = document.createElement("div");
    newHouse.setAttribute("id", house._id);
    newHouse.classList.add("chat-user");

    var houseAvatar = document.createElement("img");
    houseAvatar.classList.add("chat-avatar");
    houseAvatar.setAttribute("src", house.logo);

    var houseName = document.createElement("div");
    houseName.classList.add("chat-user-name");
    houseName.appendChild(document.createTextNode(house.name));

    var housePoints = document.createElement("span");
    housePoints.classList.add("pull-right");
    housePoints.classList.add("label");
    housePoints.classList.add("label-primary");
    housePoints.setAttribute("id", "score");
    housePoints.appendChild(document.createTextNode(house.score));

    newHouse.appendChild(housePoints);
    newHouse.appendChild(houseAvatar);
    newHouse.appendChild(houseName);

    houseContainer.appendChild(newHouse)

}

function loadNewEvent(event) {
    //New Event
    var room = $(".chat-discussion")[0];

    //Create author element
    var author = document.createElement("a");
    author.href = "/api/v1/users/" + event.user.doc;
    authorContent = document.createTextNode(event.user.firstName + " " + event.user.lastName);
    author.appendChild(authorContent);

    //Create date element
    var date = document.createElement("span");
    date.classList.add("message-date");
    var dateContent = document.createTextNode(event.timestamp);
    date.appendChild(dateContent);

    //Create date messageContent element
    var messageContent = document.createElement("span");
    messageContent.classList.add("message-content");
    var messageContentText = document.createTextNode(event.description);
    messageContent.appendChild(messageContentText);

    //Create message element
    var message = document.createElement("div");
    message.classList.add("message");
    message.appendChild(author);
    message.appendChild(date);
    message.appendChild(messageContent);

    //Create avatar (img) element
    var img = document.createElement("img");
    img.classList.add("message-avatar");
    img.setAttribute("src", event.user.avatarURL);

    // Create chatmessage element
    var chatMessage = document.createElement("div");
    chatMessage.classList.add("chat-message");
    chatMessage.classList.add(messageSide);
    flipMessageSide();

    //Add img and message to chatmessag and add chat message to room
    chatMessage.appendChild(img);
    chatMessage.appendChild(message);
    room.insertBefore(chatMessage, room.firstChild);
}

function flipMessageSide(){
    //messageSide = messageSide == "right" ? "left" : "right";
}