// =========================================================
// 1-SON TEXNIKUMI — ADMIN PANEL JS
// Super Admin & Moderator ko'p rolli tizim
// =========================================================

"use strict";

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginMessage = document.getElementById("adminLoginMessage");
const adminUserEmail = document.getElementById("adminUserEmail");
const adminRoleBadge = document.getElementById("adminRoleBadge");
const logoutBtn = document.getElementById("logoutBtn");

// Tab tugmalari
const tabNews = document.getElementById("tabNews");
const tabCourses = document.getElementById("tabCourses");
const tabGallery = document.getElementById("tabGallery");
const tabApplications = document.getElementById("tabApplications");

// Tab panellari
const newsTab = document.getElementById("newsTab");
const coursesTab = document.getElementById("coursesTab");
const galleryTab = document.getElementById("galleryTab");
const applicationsTab = document.getElementById("applicationsTab");

let currentAdminRole = "super_admin"; // 'super_admin' yoki 'moderator'

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showLoginMessage(text, type = "error") {
    adminLoginMessage.textContent = text;
    adminLoginMessage.className = `login-message ${type}`;
}

function showFormMessage(el, text, type = "error") {
    el.textContent = text;
    el.className = `admin-message show ${type}`;
}

function clearFormMessage(el) {
    el.textContent = "";
    el.className = "admin-message";
}

// =========================================================
// AUTENTIFIKATSIYA & ROLLARNI ANIQLASH
// Muhim: login/parol va rol frontend kodida saqlanmaydi.
// Auth: Supabase Auth
// Role: public.admin_roles (RLS + security-definer function)
// =========================================================

async function getAuthenticatedAdmin() {
    const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

    if (sessionError || !sessionData?.session?.user) {
        return null;
    }

    const user = sessionData.session.user;

    const { data: roleRow, error: roleError } = await supabaseClient
        .from("admin_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (roleError) {
        console.error("Admin roli tekshirilmadi:", roleError);
        return null;
    }

    const role = roleRow?.role;
    if (role !== "super_admin" && role !== "moderator") {
        return null;
    }

    return {
        user,
        email: user.email || "",
        role
    };
}

async function checkSession() {
    try {
        const admin = await getAuthenticatedAdmin();

        if (!admin) {
            try { await supabaseClient.auth.signOut(); } catch (_) {}
            showLogin();
            return;
        }

        showDashboard(admin.email, admin.role);
    } catch (e) {
        console.error("Sessiyani tekshirishda xatolik:", e);
        showLogin();
    }
}

function showLogin() {
    loginScreen.style.display = "flex";
    dashboardScreen.style.display = "none";
    currentAdminRole = null;
}

function showDashboard(email, role) {
    // Role faqat Supabase'dan olingan qiymat bo'lishi kerak.
    if (role !== "super_admin" && role !== "moderator") {
        showLogin();
        return;
    }

    currentAdminRole = role;
    loginScreen.style.display = "none";
    dashboardScreen.style.display = "block";
    adminUserEmail.textContent = email;

    if (role === "super_admin") {
        adminRoleBadge.textContent = "👑 Super Admin (To'liq huquq)";
        adminRoleBadge.className = "role-badge super";

        if (tabNews) tabNews.style.display = "";
        if (tabApplications) tabApplications.style.display = "";
        if (tabCourses) tabCourses.style.display = "";
        if (tabGallery) tabGallery.style.display = "";

        activateTab("newsTab");
        loadNewsList();
        loadApplicationsList();
        loadTelegramSettingsUI();
    } else {
        adminRoleBadge.textContent = "👔 Moderator (Faqat Rasm va Kurslar)";
        adminRoleBadge.className = "role-badge moderator";

        if (tabNews) tabNews.style.display = "none";
        if (tabApplications) tabApplications.style.display = "none";
        if (tabCourses) tabCourses.style.display = "";
        if (tabGallery) tabGallery.style.display = "";

        activateTab("coursesTab");
    }

    loadCourseList();
    loadGalleryList();
}

function activateTab(tabId) {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));

    const btn = document.querySelector(`.admin-tab[data-tab="${tabId}"]`);
    const panel = document.getElementById(tabId);

    if (btn) btn.classList.add("active");
    if (panel) panel.classList.add("active");
}

adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Maxsus loginlar frontendda saqlanmaydi.
    const email = document.getElementById("adminEmail").value.trim().toLowerCase();
    const password = document.getElementById("adminPassword").value;

    if (!email || !password) {
        showLoginMessage("Email va parolni kiriting.", "error");
        return;
    }

    const submitBtn = document.getElementById("adminLoginSubmit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Kirilmoqda...";
    showLoginMessage("Tekshirilmoqda...", "loading");

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error || !data?.user) {
            throw new Error("Email yoki parol noto'g'ri.");
        }

        // Rolni emaildan taxmin qilmaymiz.
        // Faqat admin_roles jadvalidagi server-side rolga ishonamiz.
        const { data: roleRow, error: roleError } = await supabaseClient
            .from("admin_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .maybeSingle();

        if (roleError || !roleRow ||
            !["super_admin", "moderator"].includes(roleRow.role)) {
            await supabaseClient.auth.signOut();
            throw new Error("Bu akkauntga admin panelga kirish huquqi berilmagan.");
        }

        showLoginMessage("Muvaffaqiyatli kirildi.", "success");
        showDashboard(data.user.email || email, roleRow.role);
    } catch (e) {
        console.error("Admin login:", e);
        showLoginMessage(e.message || "Kirishda xatolik yuz berdi.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Kirish";
    }
});

logoutBtn.addEventListener("click", async () => {
    try {
        await supabaseClient.auth.signOut();
    } finally {
        showLogin();
    }
});

checkSession();

// =========================================================
// TABLARNI BOSHQARISH
// =========================================================

document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        // Moderator huquqini tekshirish
        if (currentAdminRole === "moderator" && (tab.dataset.tab === "newsTab" || tab.dataset.tab === "applicationsTab")) {
            alert("Ushbu bo'lim faqat Super Admin uchun ochiq!");
            return;
        }

        activateTab(tab.dataset.tab);
    });
});

// =========================================================
// RASM YUKLASH (Supabase Storage)
// =========================================================

async function uploadImage(file) {
    if (!file) return null;

    try {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabaseClient
            .storage
            .from("site-images")
            .upload(path, file);

        if (error) throw error;

        const { data } = supabaseClient
            .storage
            .from("site-images")
            .getPublicUrl(path);

        return data.publicUrl;
    } catch (err) {
        console.warn("Rasm yuklashda xatolik:", err);
        return null;
    }
}

const newsImageInput = document.getElementById("newsImage");
if (newsImageInput) {
    newsImageInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        const preview = document.getElementById("newsImagePreview");
        if (!file || !preview) return;

        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    });
}

// =========================================================
// YANGILIKLAR — CRUD (Faqat Super Admin)
// =========================================================

const newsForm = document.getElementById("newsForm");
const newsFormMessage = document.getElementById("newsFormMessage");
const newsSubmitBtn = document.getElementById("newsSubmitBtn");
const newsCancelBtn = document.getElementById("newsCancelBtn");
const newsFormTitle = document.getElementById("newsFormTitle");

function resetNewsForm() {
    if (!newsForm) return;
    newsForm.reset();
    document.getElementById("newsId").value = "";
    const preview = document.getElementById("newsImagePreview");
    if (preview) preview.style.display = "none";
    if (newsSubmitBtn) newsSubmitBtn.textContent = "Qo'shish";
    if (newsFormTitle) newsFormTitle.textContent = "Yangi yangilik qo'shish";
    if (newsCancelBtn) newsCancelBtn.style.display = "none";
    clearFormMessage(newsFormMessage);
}

if (newsCancelBtn) newsCancelBtn.addEventListener("click", resetNewsForm);

if (newsForm) {
    newsForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (currentAdminRole !== "super_admin") {
            alert("Yangiliklarni faqat Super Admin o'zgartira oladi!");
            return;
        }

        const id = document.getElementById("newsId").value;
        const title = document.getElementById("newsTitle").value.trim();
        const category = document.getElementById("newsCategory").value.trim();
        const news_date = document.getElementById("newsDate").value || null;
        const description = document.getElementById("newsDescription").value.trim();
        const file = document.getElementById("newsImage").files[0];

        if (!title) {
            showFormMessage(newsFormMessage, "Sarlavhani kiriting.", "error");
            return;
        }

        newsSubmitBtn.disabled = true;
        showFormMessage(newsFormMessage, "Saqlanmoqda...", "loading");

        try {
            let image_url;
            if (file) {
                image_url = await uploadImage(file);
            }

            const payload = { title, category, description };
            if (news_date) payload.news_date = news_date;
            if (image_url) payload.image_url = image_url;

            let error;
            if (id) {
                ({ error } = await supabaseClient.from("news").update(payload).eq("id", id));
            } else {
                ({ error } = await supabaseClient.from("news").insert(payload));
            }

            if (error) throw error;

            showFormMessage(newsFormMessage, "Saqlandi!", "success");
            resetNewsForm();
            loadNewsList();
        } catch (err) {
            console.error(err);
            showFormMessage(newsFormMessage, "Xatolik: " + err.message, "error");
        } finally {
            newsSubmitBtn.disabled = false;
        }
    });
}

async function loadNewsList() {
    const list = document.getElementById("newsList");
    if (!list) return;
    list.innerHTML = "<p class=\"admin-empty\">Yuklanmoqda...</p>";

    try {
        const { data, error } = await supabaseClient
            .from("news")
            .select("*")
            .order("news_date", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = "<p class=\"admin-empty\">Hali yangiliklar yo'q.</p>";
            return;
        }

        list.innerHTML = data.map(item => `
            <div class="admin-row" data-id="${item.id}">
                <img src="${item.image_url || '../assets/image/texnikum.jpg'}" alt="">
                <div class="admin-row-body">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.description || "")}</p>
                </div>
                <div class="admin-row-actions">
                    <button class="edit-btn" data-action="edit-news" data-id="${item.id}">Tahrirlash</button>
                    <button class="delete-btn" data-action="delete-news" data-id="${item.id}">O'chirish</button>
                </div>
            </div>
        `).join("");
    } catch (err) {
        list.innerHTML = `<p class="admin-empty">Xatolik: ${escapeHtml(err.message)}</p>`;
    }
}

const newsListEl = document.getElementById("newsList");
if (newsListEl) {
    newsListEl.addEventListener("click", async (event) => {
        const btn = event.target.closest("button");
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.dataset.action === "delete-news") {
            if (!confirm("Ushbu yangilikni o'chirmoqchimisiz?")) return;

            const { error } = await supabaseClient.from("news").delete().eq("id", id);
            if (error) {
                alert("Xatolik: " + error.message);
                return;
            }
            loadNewsList();
            return;
        }

        if (btn.dataset.action === "edit-news") {
            const { data, error } = await supabaseClient.from("news").select("*").eq("id", id).single();
            if (error || !data) return;

            document.getElementById("newsId").value = data.id;
            document.getElementById("newsTitle").value = data.title || "";
            document.getElementById("newsCategory").value = data.category || "";
            document.getElementById("newsDate").value = data.news_date ? data.news_date.slice(0, 10) : "";
            document.getElementById("newsDescription").value = data.description || "";

            if (data.image_url) {
                const preview = document.getElementById("newsImagePreview");
                if (preview) {
                    preview.src = data.image_url;
                    preview.style.display = "block";
                }
            }

            newsFormTitle.textContent = "Yangilikni tahrirlash";
            newsSubmitBtn.textContent = "Saqlash";
            newsCancelBtn.style.display = "inline-block";
            newsForm.scrollIntoView({ behavior: "smooth" });
        }
    });
}

// =========================================================
// TA'LIM YO'NALISHLARI — CRUD (Super Admin & Moderator)
// =========================================================

const courseForm = document.getElementById("courseForm");
const courseFormMessage = document.getElementById("courseFormMessage");
const courseSubmitBtn = document.getElementById("courseSubmitBtn");
const courseCancelBtn = document.getElementById("courseCancelBtn");
const courseFormTitle = document.getElementById("courseFormTitle");

function resetCourseForm() {
    if (!courseForm) return;
    courseForm.reset();
    document.getElementById("courseId").value = "";
    courseSubmitBtn.textContent = "Qo'shish";
    courseFormTitle.textContent = "Yangi yo'nalish qo'shish";
    courseCancelBtn.style.display = "none";
    clearFormMessage(courseFormMessage);
}

if (courseCancelBtn) courseCancelBtn.addEventListener("click", resetCourseForm);

if (courseForm) {
    courseForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const id = document.getElementById("courseId").value;
        const title = document.getElementById("courseTitle").value.trim();
        const icon = document.getElementById("courseIcon").value.trim();
        const description = document.getElementById("courseDescription").value.trim();

        if (!title) {
            showFormMessage(courseFormMessage, "Nomini kiriting.", "error");
            return;
        }

        courseSubmitBtn.disabled = true;
        showFormMessage(courseFormMessage, "Saqlanmoqda...", "loading");

        try {
            const payload = { title, icon, description };
            let error;

            if (id) {
                ({ error } = await supabaseClient.from("courses").update(payload).eq("id", id));
            } else {
                const { count } = await supabaseClient
                    .from("courses")
                    .select("*", { count: "exact", head: true });

                payload.sort_order = (count || 0) + 1;
                ({ error } = await supabaseClient.from("courses").insert(payload));
            }

            if (error) throw error;

            showFormMessage(courseFormMessage, "Saqlandi!", "success");
            resetCourseForm();
            loadCourseList();
        } catch (err) {
            console.error(err);
            showFormMessage(courseFormMessage, "Xatolik: " + err.message, "error");
        } finally {
            courseSubmitBtn.disabled = false;
        }
    });
}

async function loadCourseList() {
    const list = document.getElementById("courseList");
    if (!list) return;
    list.innerHTML = "<p class=\"admin-empty\">Yuklanmoqda...</p>";

    try {
        const { data, error } = await supabaseClient
            .from("courses")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = "<p class=\"admin-empty\">Hali yo'nalishlar yo'q.</p>";
            return;
        }

        list.innerHTML = data.map(item => `
            <div class="admin-row" data-id="${item.id}">
                <div class="admin-row-icon">${escapeHtml(item.icon || "?")}</div>
                <div class="admin-row-body">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.description || "")}</p>
                </div>
                <div class="admin-row-actions">
                    <button class="edit-btn" data-action="edit-course" data-id="${item.id}">Tahrirlash</button>
                    <button class="delete-btn" data-action="delete-course" data-id="${item.id}">O'chirish</button>
                </div>
            </div>
        `).join("");
    } catch (err) {
        list.innerHTML = `<p class="admin-empty">Xatolik: ${escapeHtml(err.message)}</p>`;
    }
}

const courseListEl = document.getElementById("courseList");
if (courseListEl) {
    courseListEl.addEventListener("click", async (event) => {
        const btn = event.target.closest("button");
        if (!btn) return;

        const id = btn.dataset.id;

        if (btn.dataset.action === "delete-course") {
            if (!confirm("Ushbu yo'nalishni o'chirmoqchimisiz?")) return;

            const { error } = await supabaseClient.from("courses").delete().eq("id", id);
            if (error) {
                alert("Xatolik: " + error.message);
                return;
            }
            loadCourseList();
            return;
        }

        if (btn.dataset.action === "edit-course") {
            const { data, error } = await supabaseClient.from("courses").select("*").eq("id", id).single();
            if (error || !data) return;

            document.getElementById("courseId").value = data.id;
            document.getElementById("courseTitle").value = data.title || "";
            document.getElementById("courseIcon").value = data.icon || "";
            document.getElementById("courseDescription").value = data.description || "";

            courseFormTitle.textContent = "Yo'nalishni tahrirlash";
            courseSubmitBtn.textContent = "Saqlash";
            courseCancelBtn.style.display = "inline-block";
            courseForm.scrollIntoView({ behavior: "smooth" });
        }
    });
}

// =========================================================
// GALEREYA RASMLARI (Super Admin & Moderator)
// =========================================================

const DEFAULT_GALLERY = [
    { id: 1, title: "Texnikum bosh binosi", url: "../assets/image/texnikum.jpg" },
    { id: 2, title: "Iqtidorli o'quvchilar", url: "../assets/image/madaniyat.jpg" },
    { id: 3, title: "Tikuvchilik amaliyoti", url: "../assets/image/tikuvchi.jpg" },
    { id: 4, title: "Faollar zali", url: "../assets/image/zal.jpg" },
    { id: 5, title: "Texnikum ichki ko'rinishi", url: "../assets/image/zal2.jpg" },
    { id: 6, title: "Texnikum bog'i", url: "../assets/image/texnikumbog.jpg" }
];

function getGalleryItems() {
    try {
        const stored = localStorage.getItem("texnikum_gallery");
        return stored ? JSON.parse(stored) : DEFAULT_GALLERY;
    } catch (e) {
        return DEFAULT_GALLERY;
    }
}

function loadGalleryList() {
    const grid = document.getElementById("adminGalleryList");
    if (!grid) return;

    const items = getGalleryItems();
    if (!items || items.length === 0) {
        grid.innerHTML = "<p class='admin-empty'>Rasmlar mavjud emas.</p>";
        return;
    }

    grid.innerHTML = items.map(item => `
        <div class="admin-gallery-card">
            <img src="${item.url}" alt="${escapeHtml(item.title)}">
            <div class="admin-gallery-card-body">
                <span>${escapeHtml(item.title)}</span>
                <button type="button" class="app-action-btn delete" onclick="deleteGalleryPhoto(${item.id})">O'chirish</button>
            </div>
        </div>
    `).join("");
}

window.deleteGalleryPhoto = function(id) {
    if (!confirm("Ushbu rasmni o'chirmoqchimisiz?")) return;
    let items = getGalleryItems();
    items = items.filter(it => it.id !== id);
    localStorage.setItem("texnikum_gallery", JSON.stringify(items));
    loadGalleryList();
};

const galleryForm = document.getElementById("galleryForm");
if (galleryForm) {
    galleryForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("galleryTitle").value.trim();
        const file = document.getElementById("galleryFile").files[0];
        const msg = document.getElementById("galleryFormMessage");

        if (!title || !file) {
            showFormMessage(msg, "Iltimos, rasm va uning nomini kiriting.", "error");
            return;
        }

        showFormMessage(msg, "Rasm yuklanmoqda...", "loading");

        try {
            let photoUrl = await uploadImage(file);
            if (!photoUrl) {
                photoUrl = URL.createObjectURL(file);
            }

            const items = getGalleryItems();
            items.unshift({
                id: Date.now(),
                title: title,
                url: photoUrl
            });

            localStorage.setItem("texnikum_gallery", JSON.stringify(items));
            showFormMessage(msg, "Rasm galereyaga muvaffaqiyatli qo'shildi!", "success");
            galleryForm.reset();
            loadGalleryList();
        } catch (err) {
            showFormMessage(msg, "Xatolik: " + err.message, "error");
        }
    });
}

// =========================================================
// ARIZALAR VA XABARLAR (Faqat Super Admin)
// =========================================================

function loadApplicationsList() {
    const tbody = document.getElementById("applicationsTableBody");
    if (!tbody) return;

    const apps = typeof getApplications === "function" ? getApplications() : [];

    if (!apps || apps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="admin-empty" style="text-align:center;">Hozircha arizalar mavjud emas.</td></tr>`;
        return;
    }

    tbody.innerHTML = apps.map((app, index) => {
        let badgeClass = "new";
        if (app.status === "Qabul qilindi") badgeClass = "accepted";
        if (app.status === "Rad etildi") badgeClass = "rejected";

        const formattedDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString("uz-UZ") : "—";

        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(app.type || "Ariza")}</strong></td>
                <td>${escapeHtml(app.fullName || "—")}</td>
                <td><a href="tel:${escapeHtml(app.phone)}">${escapeHtml(app.phone || "—")}</a></td>
                <td>${escapeHtml(app.direction || app.subject || "—")}</td>
                <td>${formattedDate}</td>
                <td><span class="status-badge ${badgeClass}">${escapeHtml(app.status || "Yangi")}</span></td>
                <td>
                    <button type="button" class="app-action-btn accept" onclick="changeAppStatus(${app.id}, 'Qabul qilindi')">✓ Qabul</button>
                    <button type="button" class="app-action-btn reject" onclick="changeAppStatus(${app.id}, 'Rad etildi')">✕ Rad</button>
                    <button type="button" class="app-action-btn delete" onclick="deleteApp(${app.id})">🗑</button>
                </td>
            </tr>
        `;
    }).join("");
}

window.changeAppStatus = function(id, status) {
    if (typeof updateApplicationStatus === "function") {
        updateApplicationStatus(id, status);
        loadApplicationsList();
    }
};

window.deleteApp = function(id) {
    if (!confirm("Ushbu arizani ro'yxatdan o'chirmoqchimisiz?")) return;
    try {
        let list = getApplications();
        list = list.filter(a => a.id !== id);
        localStorage.setItem("texnikum_applications", JSON.stringify(list));
        loadApplicationsList();
    } catch (e) {
        console.error(e);
    }
};

const clearAppsBtn = document.getElementById("clearAppsBtn");
if (clearAppsBtn) {
    clearAppsBtn.addEventListener("click", () => {
        if (!confirm("Barcha arizalarni tozalashni tasdiqlaysizmi?")) return;
        localStorage.removeItem("texnikum_applications");
        loadApplicationsList();
    });
}

// =========================================================
// TELEGRAM BOT SOZLAMALARI (Super Admin)
// =========================================================

function loadTelegramSettingsUI() {
    const tokenInput = document.getElementById("tgBotToken");
    const chatIdInput = document.getElementById("tgChatId");

    if (tokenInput && chatIdInput && typeof getTelegramConfig === "function") {
        const config = getTelegramConfig();
        tokenInput.value = config.botToken || "";
        chatIdInput.value = config.chatId || "";
    }
}

const tgSettingsForm = document.getElementById("tgSettingsForm");
const tgSettingsMessage = document.getElementById("tgSettingsMessage");
const tgTestBtn = document.getElementById("tgTestBtn");

if (tgSettingsForm) {
    tgSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const botToken = document.getElementById("tgBotToken").value.trim();
        const chatId = document.getElementById("tgChatId").value.trim();

        if (typeof saveTelegramConfig === "function") {
            saveTelegramConfig(botToken, chatId);
            showFormMessage(tgSettingsMessage, "Telegram bot sozlamalari muvaffaqiyatli saqlandi!", "success");
        }
    });
}

if (tgTestBtn) {
    tgTestBtn.addEventListener("click", async () => {
        showFormMessage(tgSettingsMessage, "Telegramga test xabar yuborilmoqda...", "loading");
        const testMsg = `🔔 <b>TEST XABAR | 1-SON TEXNIKUMI</b>\n\n` +
                        `✅ Telegram bot integratsiyasi muvaffaqiyatli ishlamoqda!\n` +
                        `⏰ Vaqt: ${new Date().toLocaleString("uz-UZ")}`;

        if (typeof sendTelegramNotification === "function") {
            const result = await sendTelegramNotification(testMsg);
            if (result && result.success) {
                showFormMessage(tgSettingsMessage, "Test xabari Telegramingizga muvaffaqiyatli yuborildi! Botni tekshiring.", "success");
            } else {
                showFormMessage(tgSettingsMessage, "Xatolik: Token yoki Chat ID noto'g'ri (" + (result ? (result.reason || result.error) : "") + ")", "error");
            }
        }
    });
}
