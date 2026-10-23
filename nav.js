const liveStatusUrl = new URL("live-status.json", document.currentScript.src);

document.querySelectorAll("nav").forEach((nav) => {
    const navInner = nav.querySelector(":scope > div");
    const brand = navInner?.querySelector(":scope > a");
    const menu = Array.from(navInner?.children ?? []).find((child) => child.tagName === "DIV");

    if (!navInner || !brand || !menu) return;

    const brandIcon = brand.querySelector("svg");
    if (brandIcon) {
        const logo = document.createElement("img");
        logo.src = new URL("logo.jpg", document.currentScript.src).href;
        logo.alt = "";
        logo.setAttribute("aria-hidden", "true");
        logo.className = "h-8 w-8 rounded-full bg-white object-contain p-0.5";
        brandIcon.replaceWith(logo);
    }

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

async function updateLiveStatus() {
    try {
        const url = new URL(liveStatusUrl);
        url.searchParams.set("v", Date.now());
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Live status request failed: ${response.status}`);
        }

        const { liveStream } = await response.json();
        const isLive = Boolean(liveStream?.videoId);
        document.querySelectorAll("#live-nav-link").forEach((link) => {
            link.classList.toggle("is-live", isLive);
        });

        const liveSection = document.getElementById("livestream-section");
        const liveLayout = document.getElementById("live-layout");
        const offlineBox = document.getElementById("offline-box");
        const livePlayer = document.getElementById("live-player");
        const liveChat = document.getElementById("live-chat");
        const title = liveStream
            ? `${liveStream.channelName}: ${liveStream.title}`
            : "No live stream right now";

        if (liveSection) {
            const streamTitle = document.getElementById("stream-title");
            streamTitle.textContent = title;
            liveSection.classList.toggle("is-visible", isLive);
            livePlayer.src = isLive
                ? `https://www.youtube.com/embed/${encodeURIComponent(liveStream.videoId)}?autoplay=1`
                : "";
            liveChat.src = isLive
                ? `https://www.youtube.com/live_chat?v=${encodeURIComponent(liveStream.videoId)}&embed_domain=${encodeURIComponent(window.location.hostname)}`
                : "";
        }

        if (liveLayout && offlineBox) {
            const statusTitle = isLive ? `${liveStream.channelName} is live` : "No live stream right now";
            document.getElementById("stream-title").textContent = title;
            document.getElementById("offline-title").textContent = statusTitle;
            document.getElementById("offline-message").textContent = isLive
                ? "Watch the live stream below."
                : "Neither channel is currently broadcasting. Check back soon for live train streams and updates.";
            document.getElementById("live-status-banner").textContent = isLive
                ? `LIVE NOW ON ${liveStream.channelName}`
                : "Not live right now";

            const watchLink = document.getElementById("live-watch-link");
            const channelLink = document.getElementById("live-channel-link");
            watchLink.href = isLive
                ? `https://www.youtube.com/watch?v=${encodeURIComponent(liveStream.videoId)}`
                : "https://www.youtube.com/@NoahandEdsTrainadventures";
            watchLink.textContent = isLive ? "Watch Live Stream" : "Visit YouTube";
            channelLink.href = isLive
                ? `https://www.youtube.com/channel/${encodeURIComponent(liveStream.channelId)}`
                : "https://www.youtube.com/@NoahandEdsTrainadventures";
            channelLink.textContent = isLive
                ? `${liveStream.channelName} on YouTube`
                : "Main YouTube Channel";
            liveLayout.style.display = isLive ? "grid" : "none";
            offlineBox.style.display = isLive ? "none" : "block";
            document.getElementById("status-wrap").classList.toggle("is-live", isLive);
            livePlayer.src = isLive
                ? `https://www.youtube.com/embed/${encodeURIComponent(liveStream.videoId)}?autoplay=1`
                : "";
            liveChat.src = isLive
                ? `https://www.youtube.com/live_chat?v=${encodeURIComponent(liveStream.videoId)}&embed_domain=${encodeURIComponent(window.location.hostname)}`
                : "";
        }
    } catch (error) {
        console.error("Could not load cached live status:", error);
        document.querySelectorAll("#live-nav-link").forEach((link) => {
            link.classList.remove("is-live");
        });

        const streamTitle = document.getElementById("stream-title");
        if (streamTitle) {
            streamTitle.textContent = "Live status unavailable";
        }

        const liveStatusBanner = document.getElementById("live-status-banner");
        if (liveStatusBanner) {
            liveStatusBanner.textContent = "Live status unavailable";
        }
    }
}

updateLiveStatus();
window.setInterval(updateLiveStatus, 120000);
