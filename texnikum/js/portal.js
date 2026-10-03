// =========================================================
// 1-SON TEXNIKUMI — O'QUVCHI PORTALI JS
// Supabase'dan real ma'lumotlarni olish
// =========================================================

const PORTAL_FUNCTION_URL =
    "https://xyqekttjeuhynupjrjhk.supabase.co/functions/v1/student-portal";

const sessionRaw = localStorage.getItem("student_session");

// =========================================================
// YORDAMCHI FUNKSIYALAR
// =========================================================

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("uz-UZ");
}

function formatTime(value) {
    if (!value) return "—";

    return String(value).slice(0, 5);
}

function showPortalMessage(text, type = "error") {
    const box = document.getElementById("portalMessage");

    if (!box) return;

    box.textContent = text;
    box.className = `portal-message ${type}`;
}

// =========================================================
// HAFTA KUNLARI TARTIBI
// =========================================================

const DAYS = [
    "Dushanba",
    "Seshanba",
    "Chorshanba",
    "Payshanba",
    "Juma",
    "Shanba",
    "Yakshanba"
];

function dayOrder(day) {
    const index = DAYS.indexOf(day);

    return index === -1 ? 99 : index;
}

// =========================================================
// DARS JADVALINI GURUHLASH
// =========================================================

function groupScheduleByDay(rows) {
    const grouped = {};

    DAYS.forEach(day => {
        grouped[day] = [];
    });

    if (!Array.isArray(rows)) {
        return grouped;
    }

    rows.forEach(row => {
        const day = row.day_of_week;

        if (!grouped[day]) {
            grouped[day] = [];
        }

        grouped[day].push(row);
    });

    Object.keys(grouped).forEach(day => {
        grouped[day].sort((a, b) => {
            return String(a.start_time || "")
                .localeCompare(String(b.start_time || ""));
        });
    });

    return grouped;
}

// =========================================================
// DARS JADVALINI CHIQARISH
// =========================================================

function renderSchedule(rows) {
    const container = document.getElementById("scheduleContainer");

    if (!container) return;

    if (!Array.isArray(rows) || rows.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Dars jadvali topilmadi</h3>
                <p>Hozircha dars jadvali kiritilmagan.</p>
            </div>
        `;

        return;
    }

    const grouped = groupScheduleByDay(rows);

    let html = "";

    DAYS.forEach(day => {
        const lessons = grouped[day];

        if (!lessons || lessons.length === 0) {
            return;
        }

        html += `
            <section class="schedule-day">

                <div class="schedule-day-header">
                    <div>
                        <span class="schedule-day-label">
                            HAFTA KUNI
                        </span>

                        <h3>${escapeHtml(day)}</h3>
                    </div>

                    <span class="lesson-count">
                        ${lessons.length} ta dars
                    </span>
                </div>

                <div class="schedule-table-wrap">

                    <table class="schedule-table">

                        <thead>
                            <tr>
                                <th class="lesson-number">
                                    №
                                </th>

                                <th>
                                    Vaqt
                                </th>

                                <th>
                                    Fan nomi
                                </th>

                                <th>
                                    O‘qituvchi
                                </th>

                                <th>
                                    Xona
                                </th>
                            </tr>
                        </thead>

                        <tbody>
        `;

        lessons.forEach((lesson, index) => {
            const teacher =
                lesson.teachers?.full_name ||
                "—";

            const start =
                formatTime(lesson.start_time);

            const end =
                formatTime(lesson.end_time);

            const room =
                lesson.room ||
                lesson.classroom ||
                "—";

            html += `
                <tr>

                    <td class="lesson-number">
                        <span class="lesson-number-badge">
                            ${index + 1}
                        </span>
                    </td>

                    <td class="lesson-time">
                        <strong>
                            ${escapeHtml(start)}
                        </strong>

                        <span>
                            ${escapeHtml(end)}
                        </span>
                    </td>

                    <td class="lesson-subject">
                        <strong>
                            ${escapeHtml(
                                lesson.subject || "—"
                            )}
                        </strong>
                    </td>

                    <td class="lesson-teacher">
                        <span class="teacher-icon">
                            👨‍🏫
                        </span>

                        ${escapeHtml(teacher)}
                    </td>

                    <td class="lesson-room">
                        <span>
                            🚪
                        </span>

                        ${escapeHtml(room)}
                    </td>

                </tr>
            `;
        });

        html += `
                        </tbody>

                    </table>

                </div>

            </section>
        `;
    });

    container.innerHTML = html;
}

// =========================================================
// BAHOLARNI CHIQARISH
// =========================================================

function renderGrades(rows) {
    const body = document.getElementById("gradesBody");

    if (!body) return;

    if (!Array.isArray(rows) || rows.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="3">
                    Baholar hali kiritilmagan.
                </td>
            </tr>
        `;

        return;
    }

    body.innerHTML = rows.map(row => `
        <tr>

            <td>
                ${escapeHtml(row.subject || "—")}
            </td>

            <td>
                <strong class="grade-value">
                    ${escapeHtml(row.grade ?? "—")}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    formatDate(row.given_at)
                )}
            </td>

        </tr>
    `).join("");
}

// =========================================================
// DAVOMAT
// =========================================================

function renderAttendance(rows) {
    const body =
        document.getElementById("attendanceBody");

    const summary =
        document.getElementById("attendanceSummary");

    if (!body || !summary) return;

    if (!Array.isArray(rows) || rows.length === 0) {
        summary.textContent =
            "Davomat ma'lumotlari hali kiritilmagan.";

        body.innerHTML = `
            <tr>
                <td colspan="2">
                    Ma'lumot yo‘q.
                </td>
            </tr>
        `;

        return;
    }

    const present =
        rows.filter(
            item => item.status === "present"
        ).length;

    const late =
        rows.filter(
            item => item.status === "late"
        ).length;

    const absent =
        rows.filter(
            item => item.status === "absent"
        ).length;

    const percent =
        Math.round(
            ((present + late) / rows.length) * 100
        );

    summary.textContent =
        `Davomat: ${percent}% · ` +
        `Keldi: ${present} · ` +
        `Kechikdi: ${late} · ` +
        `Kelmagan: ${absent}`;

    const labels = {
        present: "Keldi",
        late: "Kechikdi",
        absent: "Kelmagan"
    };

    body.innerHTML = rows.map(row => `
        <tr>

            <td>
                ${escapeHtml(
                    formatDate(row.date)
                )}
            </td>

            <td>
                ${escapeHtml(
                    labels[row.status] ||
                    row.status ||
                    "—"
                )}
            </td>

        </tr>
    `).join("");
}

// =========================================================
// E'LONLAR
// =========================================================

function renderAnnouncements(rows) {
    const box =
        document.getElementById(
            "announcementsList"
        );

    if (!box) return;

    if (!Array.isArray(rows) || rows.length === 0) {
        box.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📢</div>
                <h3>E'lonlar yo‘q</h3>
                <p>Hozircha yangi e'lonlar mavjud emas.</p>
            </div>
        `;

        return;
    }

    box.innerHTML = rows.map(row => `
        <article class="announcement-item">

            <div class="announcement-icon">
                📢
            </div>

            <div class="announcement-content">

                <h3>
                    ${escapeHtml(
                        row.title || "E'lon"
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        row.body || ""
                    )}
                </p>

                <time>
                    ${escapeHtml(
                        formatDate(row.created_at)
                    )}
                </time>

            </div>

        </article>
    `).join("");
}

// =========================================================
// PORTALNI YUKLASH
// =========================================================

async function loadPortal() {

    // Session mavjud emas
    if (!sessionRaw) {
        window.location.href = "login.html";
        return;
    }

    let session;

    try {
        session = JSON.parse(sessionRaw);

    } catch (error) {

        localStorage.removeItem(
            "student_session"
        );

        localStorage.removeItem(
            "student_profile"
        );

        window.location.href = "login.html";

        return;
    }

    // Access token mavjud emas
    if (!session?.access_token) {

        localStorage.removeItem(
            "student_session"
        );

        localStorage.removeItem(
            "student_profile"
        );

        window.location.href = "login.html";

        return;
    }

    showPortalMessage(
        "Ma'lumotlar yuklanmoqda...",
        "loading"
    );

    try {

        const response = await fetch(
            PORTAL_FUNCTION_URL,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${session.access_token}`
                }
            }
        );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Portal ma'lumotlarini olishda xatolik."
            );
        }

        // =================================================
        // O'QUVCHI
        // =================================================

        const student =
            result.student || {};

        const name =
            student.full_name ||
            "O'quvchi";

        const group =
            student.group_name ||
            student.group_id ||
            "—";

        const login =
            student.login ||
            "—";

        // =================================================
        // PROFIL
        // =================================================

        const studentName =
            document.getElementById(
                "studentName"
            );

        const studentInfo =
            document.getElementById(
                "studentInfo"
            );

        const profileName =
            document.getElementById(
                "profileName"
            );

        const profileLogin =
            document.getElementById(
                "profileLogin"
            );

        const profileGroup =
            document.getElementById(
                "profileGroup"
            );

        const studentAvatar =
            document.getElementById(
                "studentAvatar"
            );

        if (studentName) {
            studentName.textContent = name;
        }

        if (studentInfo) {
            studentInfo.textContent =
                `${group}-guruh · Login: ${login}`;
        }

        if (profileName) {
            profileName.textContent = name;
        }

        if (profileLogin) {
            profileLogin.textContent = login;
        }

        if (profileGroup) {
            profileGroup.textContent = group;
        }

        if (studentAvatar) {
            studentAvatar.textContent =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "O";
        }

        // =================================================
        // MA'LUMOTLAR
        // =================================================

        renderSchedule(
            result.schedule || []
        );

        renderGrades(
            result.grades || []
        );

        renderAttendance(
            result.attendance || []
        );

        renderAnnouncements(
            result.announcements || []
        );

        showPortalMessage(
            "Ma'lumotlar muvaffaqiyatli yuklandi.",
            "success"
        );

    } catch (error) {

        console.error(
            "Portal xatosi:",
            error
        );

        showPortalMessage(
            error.message ||
            "Portal bilan bog‘lanib bo‘lmadi."
        );
    }
}

// =========================================================
// CHIQISH
// =========================================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "student_session"
            );

            localStorage.removeItem(
                "student_profile"
            );

            window.location.href =
                "login.html";
        }
    );
}

// =========================================================
// JORIY YIL
// =========================================================

const currentYear =
    document.getElementById(
        "currentYear"
    );

if (currentYear) {
    currentYear.textContent =
        new Date().getFullYear();
}

// =========================================================
// PORTALNI ISHGA TUSHIRISH
// =========================================================

loadPortal();