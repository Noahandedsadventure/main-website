document.querySelectorAll("nav").forEach((nav) => {
    const navInner = nav.querySelector(":scope > div");
    const brand = navInner?.querySelector(":scope > a");
    const menu = Array.from(navInner?.children ?? []).find((child) => child.tagName === "DIV");

    if (!navInner || !brand || !menu) return;

    navInner.classList.add("site-nav-inner");
    menu.classList.add("site-nav-links");
    menu.id = "site-nav-links";

    const toggle = document.createElement("button");
    toggle.className = "site-nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Open navigation menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", menu.id);
    toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>';
    navInner.insertBefore(toggle, menu);

    const setMenuState = (open) => {
        menu.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    };

    const syncMenuForViewport = () => {
        const desktop = window.matchMedia("(min-width: 768px)").matches;
        menu.hidden = !desktop;
        if (desktop) toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";
        setMenuState(!isExpanded);
    });

    menu.addEventListener("click", (event) => {
        if (event.target.closest("a") && window.matchMedia("(max-width: 767px)").matches) {
            setMenuState(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
            setMenuState(false);
            toggle.focus();
        }
    });

    window.addEventListener("resize", syncMenuForViewport);
    syncMenuForViewport();
});
