
function ajaxCall(method, api, data, successCB, errorCB) {
    $.ajax({
        type: method,
        url: api,
        data: data,
        cache: false,
        contentType: "application/json",
        dataType: "json",
        success: successCB,
        error: errorCB
    });
}

const apiUrl = "https://localhost:7277/api/Countries";

$(document).ready(function () {

   
    let userName = sessionStorage.getItem("loggedInUser");

    if (userName != null) {
        $("#userGreeting").text("שלום, " + userName);
        $("#userGreetingLi").show();
        $("#logoutLi").show();
        $("#loginLi").hide();
        $("#registerLi").hide();
    }

    

    $("#btnLogout").click(function (event) {
        event.preventDefault();
        sessionStorage.removeItem("loggedInUser"); 
        window.location.reload(); 
    });

    $("#loadCountriesBtn").click(function () {
        loadCountries();
    });

    $("#btnRegister").click(function (event) {
        registerUser(event);
    });

    $("#btnLogin").click(function (event) {
        loginUser(event);
    });
});


function loadCountries() {
    ajaxCall("GET", `${apiUrl}/GetAllCountries`, null, getCountriesSuccess, getCountriesError);
}

function getCountriesSuccess(countries) {
    countries.unshift(null);
    const grid = $(".countries-grid");
    grid.empty();

    for (let l = 1; l < countries.length; l++) {
        let country = countries[l];
        let fallbackImage = "https://placehold.co/320x180/0f172a/ffffff?text=No+Flag";
        let displayImage = fallbackImage;

        if (country.flagImageUrl && country.flagImageUrl.startsWith("http") && !country.flagImageUrl.includes("string")) {
            displayImage = country.flagImageUrl;
        }

        let cardHtml = `
            <div class="country-card fade-in-up">
                <div class="card-img-placeholder" style="background-image: url('${displayImage}');"></div>
                <div class="card-content">
                    <h3 class="card-title">${country.name}</h3>
                    <div class="card-info"><span><i class="fas fa-map-marker-alt"></i> אזור:</span> <span>${country.region}</span></div>
                    <div class="card-info"><span><i class="fas fa-city"></i> עיר בירה:</span> <span>${country.city || 'לא צוין'}</span></div>
                    <div class="card-info"><span><i class="fas fa-users"></i> אוכלוסייה:</span> <span>${country.population.toLocaleString()}</span></div>
                </div>
            </div>
        `;
        grid.append(cardHtml);
    }
}

function getCountriesError(err) {
    console.error("Error fetching countries:", err);
    alert("שגיאה בטעינת המדינות מהשרת");
}


function registerUser(event) {
    if (event) event.preventDefault();

    let newUser = {
        FirstName: $("#firstName").val(),
        LastName: $("#lastName").val(),
        Email: $("#email").val(),
        Password: $("#password").val(),
        FavContinent: $("#favContinent").val(),
        LanguageProficiency: $("#languageProficiency").val()
    };

    if ($("#password").val() !== $("#confirmPassword").val()) {
        alert("הסיסמאות אינן תואמות!");
        return;
    }

    ajaxCall("POST", `${apiUrl.replace("Countries", "Users")}/Register`, JSON.stringify(newUser), registerSuccess, registerError);
}

function registerSuccess(data) {
    alert("ההרשמה בוצעה בהצלחה!");
    window.location.href = "login.html";
}

function registerError(err) {
    console.error("שגיאה בהרשמה:", err);
    alert("אירעה שגיאה בתהליך ההרשמה.");
}


function loginUser(event) {
    if (event) event.preventDefault();

    let loginData = {
        Email: $("#email").val(),
        Password: $("#password").val()
    };

    ajaxCall("POST", `${apiUrl.replace("Countries", "Users")}/Login`, JSON.stringify(loginData), loginSuccess, loginError);
}

function loginSuccess(data) {
    alert("התחברת בהצלחה!");

    let fullName = data.user.FirstName + " " + data.user.LastName;

    sessionStorage.setItem("loggedInUser", fullName);

    window.location.href = "../index.html";
}
function loginError(err) {
    console.error("שגיאה בהתחברות:", err);
    alert("שגיאה בהתחברות: בדוק את המייל והסיסמה.");
}