/* =========================================================
   1-SON TEXNIKUMI
   MODERN WEBSITE - MAIN JAVASCRIPT
   OPTIMIZED + MOBILE FRIENDLY
========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       01. SELECTORS
    ===================================================== */

    const $ = selector => document.querySelector(selector);
    const $$ = selector => document.querySelectorAll(selector);

    const header = $(".header");
    const menuButton = $(".menu-button");
    const navigation = $(".navigation");
    const backToTop = $(".back-to-top");
    const contactForm = $(".contact-form");

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;


    /* =====================================================
       02. MOBILE MENU
    ===================================================== */

    const closeMenu = () => {

        if (!menuButton || !navigation) return;

        menuButton.classList.remove("active");
        navigation.classList.remove("active");

        document.body.classList.remove("menu-open");

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );
    };


    if (menuButton && navigation) {

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        menuButton.addEventListener("click", () => {

            const opened =
                navigation.classList.toggle("active");

            menuButton.classList.toggle(
                "active",
                opened
            );

            document.body.classList.toggle(
                "menu-open",
                opened
            );

            menuButton.setAttribute(
                "aria-expanded",
                String(opened)
            );

        });


        $$(".nav-link").forEach(link => {

            link.addEventListener("click", () => {
                closeMenu();
            });

        });

    }


    /* =====================================================
       03. ESCAPE KEY
    ===================================================== */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeMenu();
        }

    });


    /* =====================================================
       04. HEADER SCROLL EFFECT
    ===================================================== */

    const updateHeader = () => {

        if (!header) return;

        header.classList.toggle(
            "scrolled",
            window.scrollY > 40
        );

    };


    /* =====================================================
       05. BACK TO TOP
    ===================================================== */

    const updateBackToTop = () => {

        if (!backToTop) return;

        backToTop.classList.toggle(
            "show",
            window.scrollY > 500
        );

    };


    if (backToTop) {

        backToTop.addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: reducedMotion
                    ? "auto"
                    : "smooth"
            });

        });

    }


    /* =====================================================
       06. SCROLL PROGRESS
    ===================================================== */

    const progressBar =
        document.createElement("div");

    progressBar.className = "scroll-progress";

    progressBar.setAttribute(
        "aria-hidden",
        "true"
    );

    progressBar.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:0%;
        height:3px;
        z-index:10000;
        pointer-events:none;
        background:linear-gradient(
            90deg,
            #2563eb,
            #06b6d4
        );
        transition:width .08s linear;
    `;

    document.body.appendChild(progressBar);


    const updateProgress = () => {

        const scrollTop = window.scrollY;

        const pageHeight =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const progress =
            pageHeight > 0
                ? (scrollTop / pageHeight) * 100
                : 0;

        progressBar.style.width =
            `${Math.min(progress, 100)}%`;

    };


    /* =====================================================
       07. ACTIVE NAVIGATION
    ===================================================== */

    const sections = $$(
        "section[id]"
    );

    const navLinks = $$(
        ".nav-link"
    );


    const updateActiveNavigation = () => {

        if (!sections.length) return;

        const scrollPosition =
            window.scrollY +
            (header ? header.offsetHeight : 80) +
            100;

        let current = "";

        sections.forEach(section => {

            if (
                scrollPosition >=
                section.offsetTop
            ) {
                current =
                    section.getAttribute("id");
            }

        });


        navLinks.forEach(link => {

            const href =
                link.getAttribute("href");

            link.classList.toggle(
                "active",
                href === `#${current}`
            );

        });

    };


    /* =====================================================
       08. SMOOTH SCROLL
    ===================================================== */

    $$('a[href^="#"]').forEach(link => {

        link.addEventListener("click", event => {

            const targetId =
                link.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (!target) return;

            event.preventDefault();

            const offset =
                header
                    ? header.offsetHeight
                    : 0;

            const position =
                target.getBoundingClientRect().top +
                window.scrollY -
                offset;

            window.scrollTo({
                top: Math.max(position, 0),
                behavior: reducedMotion
                    ? "auto"
                    : "smooth"
            });

            closeMenu();

        });

    });


    /* =====================================================
       09. ONE SCROLL HANDLER
    ===================================================== */

    let scrollTicking = false;

    const handleScroll = () => {

        if (scrollTicking) return;

        scrollTicking = true;

        requestAnimationFrame(() => {

            updateHeader();
            updateBackToTop();
            updateProgress();
            updateActiveNavigation();

            scrollTicking = false;

        });

    };


    window.addEventListener(
        "scroll",
        handleScroll,
        { passive: true }
    );

    updateHeader();
    updateBackToTop();
    updateProgress();
    updateActiveNavigation();


    /* =====================================================
       10. SCROLL REVEAL
    ===================================================== */

    const revealElements = $$(
        [
            ".section-heading",
            ".about-image",
            ".about-content",
            ".education-card",
            ".news-card",
            ".portal-content",
            ".portal-dashboard",
            ".gallery-item",
            ".contact-info",
            ".contact-form-wrapper",
            ".stat-card"
        ].join(",")
    );


    if (
        revealElements.length &&
        !reducedMotion &&
        "IntersectionObserver" in window
    ) {

        revealElements.forEach((element, index) => {

            element.classList.add(
                "js-reveal"
            );

            element.style.setProperty(
                "--reveal-delay",
                `${Math.min(index * 50, 300)}ms`
            );

        });


        const revealObserver =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (!entry.isIntersecting) {
                            return;
                        }

                        entry.target.classList.add(
                            "revealed"
                        );

                        revealObserver.unobserve(
                            entry.target
                        );

                    });

                },
                {
                    threshold: 0.08,
                    rootMargin: "0px 0px -50px 0px"
                }
            );


        revealElements.forEach(element => {

            revealObserver.observe(element);

        });

    }


    /* =====================================================
       11. CARD STAGGER
    ===================================================== */

    [
        ".education-card",
        ".news-card",
        ".stat-card",
        ".gallery-item"
    ].forEach(selector => {

        $$(selector).forEach(
            (card, index) => {

                if (reducedMotion) return;

                card.style.setProperty(
                    "--card-delay",
                    `${Math.min(index * 70, 350)}ms`
                );

            }
        );

    });


    /* =====================================================
       12. NUMBER COUNTERS
    ===================================================== */

    const counters =
        $$("[data-counter]");


    const animateCounter = element => {

        const target =
            Number(
                element.dataset.counter
            );

        if (!Number.isFinite(target)) {
            return;
        }

        if (reducedMotion) {

            element.textContent =
                target.toLocaleString("uz-UZ");

            return;
        }

        const duration = 1600;
        const start = performance.now();


        const animate = currentTime => {

            const progress =
                Math.min(
                    (currentTime - start) /
                    duration,
                    1
                );

            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );

            const value =
                Math.floor(
                    target * eased
                );

            element.textContent =
                value.toLocaleString("uz-UZ");


            if (progress < 1) {

                requestAnimationFrame(
                    animate
                );

            } else {

                element.textContent =
                    target.toLocaleString(
                        "uz-UZ"
                    );

            }

        };


        requestAnimationFrame(animate);

    };


    if (
        counters.length &&
        "IntersectionObserver" in window
    ) {

        const counterObserver =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (
                            !entry.isIntersecting ||
                            entry.target.dataset.started
                        ) {
                            return;
                        }

                        entry.target.dataset.started =
                            "true";

                        animateCounter(
                            entry.target
                        );

                        counterObserver.unobserve(
                            entry.target
                        );

                    });

                },
                {
                    threshold: 0.5
                }
            );


        counters.forEach(counter => {

            counterObserver.observe(
                counter
            );

        });

    }


    /* =====================================================
       13. IMAGE LOADING
    ===================================================== */

    $$("img").forEach(image => {

        const markLoaded = () => {

            image.classList.add(
                "loaded"
            );

        };


        if (image.complete) {

            markLoaded();

        } else {

            image.addEventListener(
                "load",
                markLoaded,
                { once: true }
            );

            image.addEventListener(
                "error",
                () => {
                    image.classList.add(
                        "image-error"
                    );
                },
                { once: true }
            );

        }

    });


    /* =====================================================
       14. HERO PARALLAX
    ===================================================== */

    const heroVisual =
        $(".hero-visual");


    if (
        heroVisual &&
        !reducedMotion &&
        window.innerWidth > 950
    ) {

        const updateHeroParallax = () => {

            const scroll =
                Math.min(
                    window.scrollY,
                    700
                );

            heroVisual.style.transform =
                `translate3d(
                    0,
                    ${scroll * 0.05}px,
                    0
                )`;

        };


        window.addEventListener(
            "scroll",
            updateHeroParallax,
            { passive: true }
        );

    }


    /* =====================================================
       15. HERO CARD 3D TILT
    ===================================================== */

    const heroCard =
        $(".hero-image-card");


    if (
        heroCard &&
        !reducedMotion &&
        window.matchMedia(
            "(hover: hover)"
        ).matches
    ) {

        heroCard.addEventListener(
            "mousemove",
            event => {

                const rect =
                    heroCard.getBoundingClientRect();

                const x =
                    event.clientX -
                    rect.left;

                const y =
                    event.clientY -
                    rect.top;

                const rotateX =
                    (y - rect.height / 2) /
                    45;

                const rotateY =
                    (rect.width / 2 - x) /
                    45;

                heroCard.style.transform =
                    `perspective(1000px)
                     rotateX(${rotateX}deg)
                     rotateY(${rotateY}deg)
                     translateY(-5px)`;

            }
        );


        heroCard.addEventListener(
            "mouseleave",
            () => {

                heroCard.style.transform =
                    "perspective(1000px) rotateY(-3deg)";

            }
        );

    }


    /* =====================================================
       16. BUTTON RIPPLE
    ===================================================== */

    if (!reducedMotion) {

        $$(".btn").forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    const rect =
                        button.getBoundingClientRect();

                    const size =
                        Math.max(
                            rect.width,
                            rect.height
                        );

                    const ripple =
                        document.createElement(
                            "span"
                        );

                    ripple.className =
                        "button-ripple";


                    ripple.style.cssText = `
                        position:absolute;
                        width:${size}px;
                        height:${size}px;
                        left:${
                            event.clientX -
                            rect.left -
                            size / 2
                        }px;
                        top:${
                            event.clientY -
                            rect.top -
                            size / 2
                        }px;
                        border-radius:50%;
                        background:rgba(
                            255,255,255,.25
                        );
                        pointer-events:none;
                        transform:scale(0);
                        opacity:1;
                    `;


                    button.appendChild(
                        ripple
                    );


                    requestAnimationFrame(() => {

                        ripple.style.transition =
                            "transform .6s ease, opacity .6s ease";

                        ripple.style.transform =
                            "scale(2)";

                        ripple.style.opacity =
                            "0";

                    });


                    setTimeout(() => {

                        ripple.remove();

                    }, 650);

                }
            );

        });

    }


    /* =====================================================
       17. NEWS CARD EFFECT
    ===================================================== */

    if (
        !reducedMotion &&
        window.matchMedia(
            "(hover: hover)"
        ).matches
    ) {

        $$(".news-card").forEach(card => {

            card.addEventListener(
                "mouseenter",
                () => {

                    card.style.transform =
                        "translateY(-9px)";

                }
            );


            card.addEventListener(
                "mouseleave",
                () => {

                    card.style.transform =
                        "";

                }
            );

        });

    }


    /* =====================================================
       18. STAT CARD TILT
    ===================================================== */

    if (
        !reducedMotion &&
        window.matchMedia(
            "(hover: hover)"
        ).matches
    ) {

        $$(".stat-card").forEach(card => {

            card.addEventListener(
                "mousemove",
                event => {

                    const rect =
                        card.getBoundingClientRect();

                    const x =
                        event.clientX -
                        rect.left;

                    const y =
                        event.clientY -
                        rect.top;

                    const rotateX =
                        (rect.height / 2 - y) /
                        35;

                    const rotateY =
                        (x - rect.width / 2) /
                        35;

                    card.style.transform =
                        `perspective(700px)
                         rotateX(${rotateX}deg)
                         rotateY(${rotateY}deg)
                         translateY(-5px)`;

                }
            );


            card.addEventListener(
                "mouseleave",
                () => {

                    card.style.transform =
                        "";

                }
            );

        });

    }


    /* =====================================================
       19. CONTACT FORM
    ===================================================== */

    if (contactForm) {

        contactForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const button =
                    contactForm.querySelector(
                        'button[type="submit"]'
                    );

                if (!button) return;


                const original =
                    button.innerHTML;


                button.disabled = true;

                button.innerHTML =
                    "Yuborilmoqda...";


                setTimeout(() => {

                    button.innerHTML =
                        "✓ Xabar yuborildi";

                    button.style.background =
                        "#10b981";


                    setTimeout(() => {

                        button.innerHTML =
                            original;

                        button.disabled =
                            false;

                        button.style.background =
                            "";

                        contactForm.reset();

                    }, 2000);


                }, 900);

            }
        );

    }


    /* =====================================================
       20. GALLERY EFFECT
    ===================================================== */

    if (
        !reducedMotion &&
        window.matchMedia(
            "(hover: hover)"
        ).matches
    ) {

        $$(".gallery-item").forEach(item => {

            item.addEventListener(
                "mousemove",
                event => {

                    const rect =
                        item.getBoundingClientRect();

                    item.style.setProperty(
                        "--mouse-x",
                        `${event.clientX - rect.left}px`
                    );

                    item.style.setProperty(
                        "--mouse-y",
                        `${event.clientY - rect.top}px`
                    );

                }
            );

        });

    }


    /* =====================================================
       21. RESIZE
    ===================================================== */

    let resizeTimer;

    window.addEventListener(
        "resize",
        () => {

            clearTimeout(
                resizeTimer
            );

            resizeTimer = setTimeout(
                () => {

                    if (
                        window.innerWidth <=
                        950
                    ) {

                        if (heroVisual) {
                            heroVisual.style.transform =
                                "";
                        }

                    }

                },
                150
            );

        },
        { passive: true }
    );


    /* =====================================================
       22. PAGE LOADED
    ===================================================== */

    window.addEventListener(
        "load",
        () => {

            document.body.classList.add(
                "page-loaded"
            );

        },
        { once: true }
    );


    /* =====================================================
       23. CONSOLE
    ===================================================== */

    console.log(
        "%c1-SON TEXNIKUMI",
        `
        color:#2563eb;
        font-size:22px;
        font-weight:800;
        `
    );

    console.log(
        "%cSayt muvaffaqiyatli ishga tushdi!",
        `
        color:#10b981;
        font-size:13px;
        font-weight:600;
        `
    );

});
