// =========================================================
// 1-SON TEXNIKUMI — TELEGRAM BOT VA ARIZALAR BOSHQARUVI
// =========================================================

"use strict";

const DEFAULT_TG_CONFIG = {
    // @BotFather orqali olingan bot tokeni (Sux tuman 1-son texnikumi boti)
    botToken: "", 
    // Xabar borishi kerak bo'lgan Telegram ID yoki kanal/guruh ID
    chatId: "5553590401"
};

/**
 * Hozirgi Telegram sozlamalarini olish (mahalliy saqlangan yoki standart)
 */
function getTelegramConfig() {
    try {
        const stored = localStorage.getItem("texnikum_tg_config");
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {}
    return DEFAULT_TG_CONFIG;
}

/**
 * Telegram sozlamalarini saqlash
 */
function saveTelegramConfig(botToken, chatId) {
    const config = {
        botToken: (botToken || "").trim(),
        chatId: (chatId || "").trim()
    };
    localStorage.setItem("texnikum_tg_config", JSON.stringify(config));
    return config;
}

/**
 * Telegram bot orqali xabar yuborish
 * @param {string} text - Yuboriladigan xabar matni (HTML formatida)
 */
async function sendTelegramNotification(text) {
    const config = getTelegramConfig();

    if (!config.botToken) {
        console.warn("Telegram bot tokeni kiritilmagan.");
        return { success: false, reason: "Bot token kiritilmagan" };
    }

    if (!config.chatId) {
        console.warn("Telegram Chat ID kiritilmagan.");
        return { success: false, reason: "Chat ID kiritilmagan" };
    }

    try {
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: config.chatId,
                text: text,
                parse_mode: "HTML"
            })
        });

        const data = await response.json();
        return { success: data.ok, data };
    } catch (err) {
        console.error("Telegram xabarnoma xatosi:", err);
        return { success: false, error: err };
    }
}

/**
 * Arizani mahalliy xotiraga (Admin panel ko'rishi uchun) saqlash
 */
function saveApplication(appData) {
    try {
        const list = JSON.parse(localStorage.getItem("texnikum_applications") || "[]");
        const newApp = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            status: "Yangi",
            ...appData
        };
        list.unshift(newApp);
        localStorage.setItem("texnikum_applications", JSON.stringify(list));
        return newApp;
    } catch (e) {
        console.error("Arizani saqlashda xatolik:", e);
        return null;
    }
}

/**
 * Saqlangan arizalarni olish
 */
function getApplications() {
    try {
        return JSON.parse(localStorage.getItem("texnikum_applications") || "[]");
    } catch (e) {
        return [];
    }
}

/**
 * Ariza holatini yangilash (Qabul qilindi / Rad etildi)
 */
function updateApplicationStatus(id, newStatus) {
    try {
        const list = getApplications();
        const item = list.find(a => a.id === id);
        if (item) {
            item.status = newStatus;
            localStorage.setItem("texnikum_applications", JSON.stringify(list));
            return true;
        }
    } catch (e) {
        console.error(e);
    }
    return false;
}
