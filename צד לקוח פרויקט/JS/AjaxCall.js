// =========================================
// משתנים גלובליים
// =========================================
const apiUrl = "https://localhost:7277/api/Countries";
let allCountries = []; // משתנה לשמירת כל המדינות לצורך סינון

// =========================================
// פונקציית עזר לקריאות שרת (AJAX)
// =========================================
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

// =========================================
// כשהדף מוכן (האזנה לאירועים)
// =========================================
$(document).ready(function () {
    // טעינת מדינות (בלחיצה על כפתור, אם יש כזה ב-index.html)
    $("#loadCountriesBtn").click(function () {
        loadCountries();
    });

    // מאזינים לטופס ההתחברות (ב-login.html)
    $("#loginForm").submit(function (event) {
        loginUser(event);
    });

    // מאזינים להרשמה (ב-register.html)
    $("#btnRegister").click(function (event) {
        registerUser(event);
    });

    // --- התיקון כאן: מאזינים לכל הפילטרים, כולל המטבע ---
    $(document).on("keyup", "#searchInput", applyFiltersAndSort);
    $(document).on("change", "#regionFilter, #sortBy, #currencyFilter", applyFiltersAndSort);
    checkLoginStatus(); });

// =========================================
// אזור המדינות - שליפה, ציור וסינון
// =========================================
function loadCountries() {
    ajaxCall("GET", `${apiUrl}/GetAllCountries`, null, getCountriesSuccess, getCountriesError);
}

function getCountriesSuccess(countries) {
    // מנקים ערכים ריקים מהשרת ושומרים במשתנה הגלובלי
    allCountries = countries.filter(c => c !== null);

    // ממלאים את תפריט המטבעות הדינמי
    populateCurrencyDropdown();

    // מציירים את כל המדינות בפעם הראשונה
    renderCountries(allCountries);
}

function getCountriesError(err) {
    console.error("Error fetching countries:", err);
    alert("שגיאה בטעינת המדינות מהשרת");
}

function renderCountries(countriesToRender) {
    const grid = $(".countries-grid");
    grid.empty(); // מנקים את המסך לפני שמציירים מחדש

    for (let i = 0; i < countriesToRender.length; i++) {
        let country = countriesToRender[i];
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
                    <div class="card-info"><span><i class="fas fa-users"></i> אוכלוסייה:</span> <span>${(country.population || 0).toLocaleString()}</span></div>
                    
                    <!-- כפתור הוספה לרשימה -->
                    <button onclick="openSaveModal('${country.id}')" style="width: 100%; margin-top: 15px; padding: 8px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid #3b82f6; border-radius: 6px; cursor: pointer; transition: 0.3s; font-family: inherit;">
                        <i class="fas fa-bookmark"></i> שים ברשימה
                    </button>
                </div>
            </div>
        `;
        grid.append(cardHtml);
    }
}

function applyFiltersAndSort() {
    // שולפים בצורה בטוחה ומוסיפים trim() כדי למנוע בעיות רווחים שקופים
    let searchText = $("#searchInput").val() ? $("#searchInput").val().toLowerCase().trim() : "";
    let selectedRegion = $("#regionFilter").val() ? $("#regionFilter").val() : "";
    let selectedCurrency = $("#currencyFilter").val() ? $("#currencyFilter").val().toLowerCase().trim() : "";
    let sortBy = $("#sortBy").val() ? $("#sortBy").val() : "";

    // 1. סינון קשוח ומוחלט (חייב לקיים את כל התנאים במקביל - קשר AND)
    let filteredCountries = allCountries.filter(c => {
        let name = c.name ? String(c.name).toLowerCase() : "";
        let lang = c.language ? String(c.language).toLowerCase() : "";
        let curr = c.currency ? String(c.currency).toLowerCase().trim() : "";
        let region = c.region ? String(c.region) : "";

        // תנאי 1: חיפוש טקסט
        let matchSearch = true;
        if (searchText !== "") {
            matchSearch = name.includes(searchText) || lang.includes(searchText) || curr.includes(searchText);
        }

        // תנאי 2: בחירת אזור
        let matchRegion = true;
        if (selectedRegion !== "") {
            matchRegion = (region === selectedRegion);
        }

        // תנאי 3: בחירת מטבע (בדיקה שלמה ומדויקת === במקום includes)
        let matchCurrency = true;
        if (selectedCurrency !== "") {
            matchCurrency = (curr === selectedCurrency);
        }

        // רק מדינה שמקיימת את *כל* התנאים שנבחרו בו-זמנית תחזור (true) ותוצג במסך!
        return matchSearch && matchRegion && matchCurrency;
    });

    // 2. מיון בטוח
    if (sortBy === "name_asc") {
        filteredCountries.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    } else if (sortBy === "name_desc") {
        filteredCountries.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
    } else if (sortBy === "pop_desc") {
        filteredCountries.sort((a, b) => (b.population || 0) - (a.population || 0));
    } else if (sortBy === "pop_asc") {
        filteredCountries.sort((a, b) => (a.population || 0) - (b.population || 0));
    } else if (sortBy === "area_desc") {
        filteredCountries.sort((a, b) => (b.area || 0) - (a.area || 0));
    }

    // 3. ציור מחדש של המסך
    renderCountries(filteredCountries);
}

// =========================================
// פונקציה ששולפת את כל המטבעות מה-API ובונה את התפריט
// =========================================
function populateCurrencyDropdown() {
    let uniqueCurrencies = new Set();

    // עוברים על כל המדינות במאגר
    allCountries.forEach(c => {
        let curr = c.currency;
        if (curr && String(curr).trim() !== "") {
            uniqueCurrencies.add(String(curr).trim());
        }
    });

    // הופכים את ה-Set למערך וממיינים לפי סדר א"ב
    let sortedCurrencies = Array.from(uniqueCurrencies).sort();
    let dropdown = $("#currencyFilter");

    // מנקים אותו קודם (משאירים רק את "כל המטבעות")
    dropdown.find("option:not(:first)").remove();

    // מזריקים את המטבעות לתפריט
    sortedCurrencies.forEach(curr => {
        dropdown.append(`<option value="${curr.toLowerCase()}">${curr}</option>`);
    });
}

// =========================================
// אזור משתמשים - הרשמה והתחברות
// =========================================
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

    ajaxCall("POST", `https://localhost:7277/api/Users/Register`, JSON.stringify(newUser), registerSuccess, registerError);
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

    $.ajax({
        type: "POST",
        url: "https://localhost:7277/api/Users/Login",
        data: JSON.stringify(loginData),
        contentType: "application/json",
        dataType: "json",
        success: loginSuccess,
        error: loginError
    });
}

function loginSuccess(data) {
    alert("התחברת בהצלחה!");
    // שימוש באותיות גדולות (FirstName) כפי שחוזר מהשרת
    let fullName = data.user.FirstName + " " + data.user.LastName;
    sessionStorage.setItem("loggedInUser", fullName);

    // נתיב יחסי מתוקן כדי לצאת מתיקיית Pages חזרה לשורש
    window.location.href = "../index.html";
}

function loginError(err) {
    console.error("שגיאה בהתחברות:", err);
    alert("שגיאה בהתחברות: בדוק את המייל והסיסמה.");
}
// =========================================
// אזור הרשימות האישיות של המשתמש (LocalStorage)
// =========================================

// משיכת הרשימות הקיימות מהדפדפן, או יצירת מבנה התחלתי ריק
let userLists = JSON.parse(localStorage.getItem("userLists")) || {
    "מועדפים ❤️": [],
    "יעדים לטיסה ✈️": [],
    "הייתי שם 🌍": []
};

// משתני עזר לניהול המודלים
let currentSelectedCountryId = "";
let countryToMoveId = "";
let currentMoveList = "";

// 1. פתיחה וסגירה של חלון השמירה
function openSaveModal(countryId) {
    currentSelectedCountryId = countryId;
    $("#saveModal").fadeIn();
}

function closeSaveModal() {
    $("#saveModal").fadeOut();
}

// 2. שמירת המדינה לרשימה שנבחרה
function confirmSaveToList() {
    let selectedList = $("#listSelector").val();

    // מוודאים שהמדינה לא שמורה שם כבר
    if (userLists[selectedList].includes(currentSelectedCountryId)) {
        alert("המדינה כבר שמורה ברשימה זו!");
    } else {
        userLists[selectedList].push(currentSelectedCountryId);
        localStorage.setItem("userLists", JSON.stringify(userLists)); // שמירה לזכרון
        alert("נשמר בהצלחה!");
    }
    closeSaveModal();
}

// 3. מעבר בין מסך החיפוש הראשי למסך הרשימות
function toggleMyLists() {
    let listsScreen = $("#myListsScreen");

    if (listsScreen.is(":visible")) {
        // אם פתוח - סוגרים וחוזרים לחיפוש
        listsScreen.hide();
        $(".filters-container, .countries-grid").fadeIn();
    } else {
        // אם סגור - מסתירים את החיפוש ומציגים את הרשימות
        $(".filters-container, .countries-grid").hide();
        listsScreen.fadeIn();
        renderLists(); // מצייר את הרשימות המעודכנות
    }
}

// 4. ציור הרשימות על המסך
function renderLists() {
    let container = $("#listsContainer");
    container.empty();

    // עוברים על כל רשימה בלולאה
    for (let listName in userLists) {
        let listHtml = `
            <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; padding: 20px; border-radius: 12px; width: 320px; min-height: 250px;">
                <h3 style="color: white; text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">${listName}</h3>
                <ul style="list-style: none; padding: 0; margin-top: 15px;">
        `;

        // אם הרשימה ריקה
        if (userLists[listName].length === 0) {
            listHtml += `<li style="text-align: center; color: #94a3b8; margin-top: 20px;">הרשימה ריקה</li>`;
        } else {
            // אם יש מדינות, מציירים אותן
            userLists[listName].forEach(countryId => {
                let c = allCountries.find(x => x.id === countryId); // מציאת שם המדינה המלא לפי ה-ID
                if (c) {
                    listHtml += `
                        <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(15, 23, 42, 0.6); border-radius: 8px; color: white;">
                            <span>${c.name}</span>
                            <div>
                                <button onclick="openMoveModal('${countryId}', '${listName}')" title="העבר לרשימה אחרת" style="background: none; border: none; cursor: pointer; color: #60a5fa; margin-left: 5px;"><i class="fas fa-exchange-alt"></i></button>
                                <button onclick="removeFromList('${countryId}', '${listName}')" title="הסר" style="background: none; border: none; cursor: pointer; color: #f87171;"><i class="fas fa-trash"></i></button>
                            </div>
                        </li>
                    `;
                }
            });
        }

        listHtml += `</ul></div>`;
        container.append(listHtml);
    }
}

// 5. הסרה מרשימה
function removeFromList(countryId, listName) {
    if (confirm("האם אתה בטוח שברצונך להסיר את המדינה מהרשימה?")) {
        userLists[listName] = userLists[listName].filter(id => id !== countryId); // סינון החוצה
        localStorage.setItem("userLists", JSON.stringify(userLists));
        renderLists(); // רענון מיידי של התצוגה
    }
}

// 6. פתיחת חלון העברה
function openMoveModal(countryId, currentList) {
    countryToMoveId = countryId;
    currentMoveList = currentList;

    let moveSelector = $("#moveSelector");
    moveSelector.empty();

    // ממלאים את תפריט ההעברה רק ברשימות האחרות (לא זו שהמדינה כבר נמצאת בה)
    for (let listName in userLists) {
        if (listName !== currentList) {
            moveSelector.append(`<option value="${listName}">${listName}</option>`);
        }
    }

    $("#moveModal").fadeIn();
}

function closeMoveModal() {
    $("#moveModal").fadeOut();
}

// 7. ביצוע העברה בפועל
function confirmMove() {
    let targetList = $("#moveSelector").val();

    // מחיקה מהרשימה הישנה
    userLists[currentMoveList] = userLists[currentMoveList].filter(id => id !== countryToMoveId);

    // הוספה לרשימה החדשה (רק אם היא לא שם בטעות)
    if (!userLists[targetList].includes(countryToMoveId)) {
        userLists[targetList].push(countryToMoveId);
    }

    localStorage.setItem("userLists", JSON.stringify(userLists));
    closeMoveModal();
    renderLists(); // רענון המסך
}
function checkLoginStatus() {
    let loggedInUser = sessionStorage.getItem("loggedInUser");

    if (loggedInUser) {
        // 1. אם המשתמש מחובר: נציג את הברכה ואת כפתור ההתנתקות
        $("#userGreetingLi").show();
        $("#userGreeting").text("שלום, " + loggedInUser);
        $("#logoutLi").show();

        // 2. נעלים את כפתורי ההתחברות וההרשמה
        $("#loginLi").hide();
        $("#registerLi").hide();
    } else {
        // 3. אם המשתמש לא מחובר: נציג רק התחברות והרשמה
        $("#userGreetingLi").hide();
        $("#logoutLi").hide();
        $("#loginLi").show();
        $("#registerLi").show();
    }
}

// פונקציית התנתקות
function logoutUser() {
    $(document).on("click", "#btnLogout", function (e) {
        e.preventDefault();
        sessionStorage.removeItem("loggedInUser");
        window.location.href = "index.html"; // או רענון דף
    });
}