// =========================================================
// 1-SON TEXNIKUMI — DINAMIK KONTENT (Yangiliklar / Yo'nalishlar)
// Bazadagi (Supabase) ma'lumotlarni sahifaga chiqaradi.
// Agar internet/baza bilan muammo bo'lsa, sahifadagi tayyor
// (static) namunaviy kontent o'zgarmasdan qoladi.
// =========================================================

"use strict";

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatNewsDate(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const months = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
    ];

    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function newsCardHtml(item, pathPrefix) {
    const image = item.image_url || `${pathPrefix}assets/image/texnikum.jpg`;

    return `
        <article class="news-card">
            <div class="news-image">
                <img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" loading="lazy">
                <span class="news-category">${escapeHtml(item.category || "YANGILIK")}</span>
            </div>
            <div class="news-body">
                <time>${escapeHtml(formatNewsDate(item.news_date))}</time>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description || "")}</p>
                <a href="${pathPrefix}pages/news.html">Batafsil</a>
            </div>
        </article>
    `;
}

function courseCardHtml(item, index, pathPrefix, withNumber) {
    const number = String(index + 1).padStart(2, "0");

    return `
        <article class="education-card">
            ${withNumber ? `<span class="education-number">${number}</span>` : ""}
            <div class="education-icon">${escapeHtml(item.icon || "📘")}</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description || "")}</p>
            <a href="${pathPrefix}pages/courses.html">Batafsil</a>
        </article>
    `;
}

async function loadNews({ gridSelector, limit, pathPrefix = "" }) {
    const grid = document.querySelector(gridSelector);
    if (!grid) return;

    try {
        const { data, error } = await supabaseClient
            .from("news")
            .select("*")
            .order("news_date", { ascending: false })
            .limit(limit || 100);

        if (error) throw error;
        if (!data || data.length === 0) return; // static fallback qoladi

        grid.innerHTML = data
            .map(item => newsCardHtml(item, pathPrefix))
            .join("");
    } catch (err) {
        console.error("Yangiliklarni yuklashda xatolik:", err);
        // static fallback saqlanib qoladi
    }
}

async function loadCourses({ gridSelector, limit, pathPrefix = "", withNumber = false }) {
    const grid = document.querySelector(gridSelector);
    if (!grid) return;

    try {
        const { data, error } = await supabaseClient
            .from("courses")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return; // static fallback qoladi

        const items = limit ? data.slice(0, limit) : data;

        grid.innerHTML = items
            .map((item, index) => courseCardHtml(item, index, pathPrefix, withNumber))
            .join("");
    } catch (err) {
        console.error("Yo'nalishlarni yuklashda xatolik:", err);
        // static fallback saqlanib qoladi
    }
}
