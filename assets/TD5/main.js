function submitFeedy() {
    var messageElement = document.getElementById('message')
    var message = messageElement.value;
    messageElement.value = "";
    var URL = apiBase + "feedy";
    var xhr = new XMLHttpRequest();
    xhr.open("POST", URL, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var data = JSON.stringify({"message" : message});
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            addFeedy(JSON.parse(xhr.response));
        }
    }
    xhr.send(data);
}

function addFeedy(feedyArray) {
    var feed = document.getElementById("feed");
    var form = document.getElementById("feedy-new");
    var feedy = document.createElement("div");
    feedy.classList.add("feedy")
    var header = document.createElement("div");
    header.classList.add("feedy-header");
    var aLink = document.createElement("a");
    aLink.href = pagePersoBase + feedyArray["utilisateur"]["idUtilisateur"];
    var img = document.createElement("img");
    img.src = imgBase+"/utilisateurs/" + feedyArray["utilisateur"]["profilePictureName"];
    img.classList.add("avatar")
    var infos = document.createElement("div");
    infos.classList.add("feedy-info");
    var spanLogin = document.createElement("span");
    spanLogin.innerHTML = feedyArray["utilisateur"]["login"];
    var spanSeparation = document.createElement("span");
    spanSeparation.innerHTML = " - ";
    var spanDate = document.createElement("span");
    spanDate.innerHTML = feedyArray["date"];
    var pMessage = document.createElement("p");
    pMessage.innerHTML = feedyArray["message"];
    var buttonSupprimer = document.createElement("button");
    buttonSupprimer.classList.add('delete-feedy');
    buttonSupprimer.innerHTML = "Supprimer";
    buttonSupprimer.onclick = function() {removeFeedy(buttonSupprimer, feedyArray["idPublication"])};
    infos.append(spanLogin, spanSeparation, spanDate, pMessage, buttonSupprimer);
    aLink.append(img);
    header.append(aLink, infos);
    feedy.append(header);
    feed.insertBefore(feedy, form.nextSibling);
}

function removeFeedy(button, id) {
    var URL = apiBase + "feedy/"+id;
    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", URL, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var data = JSON.stringify({});
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            var feed = document.getElementById("feed");
            var feedy = button.closest(".feedy");
            feedy.remove();
        }
    }
    xhr.send(data);
}

function removeUser(id) {
    var URL = apiBase + "utilisateur/"+id;
    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", URL, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var data = JSON.stringify({});
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            window.location.replace(siteBase);
        }
    }
    xhr.send(data);
}