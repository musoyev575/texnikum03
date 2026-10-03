// ========================================
// 1-SON TEXNIKUMI — LOGIN JS
// ========================================

const LOGIN_FUNCTION_URL =
    "https://xyqekttjeuhynupjrjhk.supabase.co/functions/v1/student-login";

// HTML elementlar
const loginForm = document.getElementById("loginForm");
const loginInput = document.getElementById("login");
const passwordInput = document.getElementById("password");
const messageBox = document.getElementById("loginMessage");


// Xabar chiqarish
function showMessage(message, type = "error") {
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `login-message ${type}`;
}


// Login form yuborilganda
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const login = loginInput.value.trim();
    const password = passwordInput.value;

    // Tekshirish
    if (!login || !password) {
        showMessage("Login va parolni kiriting.", "error");
        return;
    }

    // Tugmani topish
    const submitButton = loginForm.querySelector('button[type="submit"]');

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Kirilmoqda...";
    }

    showMessage("Ma'lumotlar tekshirilmoqda...", "loading");

    try {
        // Supabase Edge Function'ga so'rov
        const response = await fetch(LOGIN_FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                login: login,
                password: password
            })
        });

        const data = await response.json();

        // Xatolik
        if (!response.ok) {
            throw new Error(
                data.error || "Login yoki parol noto'g'ri."
            );
        }

        // Session mavjudligini tekshirish
        if (!data.session) {
            throw new Error("Sessiya yaratilmadi.");
        }

        // O'quvchi ma'lumotlarini saqlash
        localStorage.setItem(
            "student_session",
            JSON.stringify(data.session)
        );

        if (data.student) {
            localStorage.setItem(
                "student_profile",
                JSON.stringify(data.student)
            );
        }

        showMessage(
            "Muvaffaqiyatli kirdingiz! Portal ochilmoqda...",
            "success"
        );

        // Portalga o'tish
        setTimeout(() => {
            window.location.href = "portal.html";
        }, 800);

    } catch (error) {
        console.error("Login xatosi:", error);

        showMessage(
            error.message || "Kirishda xatolik yuz berdi.",
            "error"
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Kirish";
        }
    }
});