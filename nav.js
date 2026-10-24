const liveStatusUrl = new URL("live-status.json", document.currentScript.src);
const siteRoot = new URL(".", document.currentScript.src);
const isHalloween = (() => {
    const now = new Date();
    return now >= new Date(2026, 9, 23) && now < new Date(2026, 10, 2);
})();

document.body.classList.toggle("halloween-theme", isHalloween);

const brandLogoUrl = new URL(
    isHalloween ? "gallery/photos/image.jpg" : "logo.jpg",
    siteRoot,
);
document.querySelectorAll('link[rel~="icon"]').forEach((icon) => {
    icon.href = brandLogoUrl.href;
});
const socialImage = document.querySelector('meta[property="og:image"]');
if (socialImage) {
    socialImage.content = brandLogoUrl.href;
}
const socialImageAlt = document.querySelector('meta[property="og:image:alt"]');
if (socialImageAlt && isHalloween) {
    socialImageAlt.content = "Halloween themed Noah & Ed's Train Adventures logo";
}

document.querySelectorAll("nav").forEach((nav) => {
    const navInner = nav.querySelector(":scope > div");
    const brand = navInner?.querySelector(":scope > a");
    const menu = Array.from(navInner?.children ?? []).find((child) => child.tagName === "DIV");

    if (!navInner || !brand || !menu) return;

    const brandIcon = brand.querySelector("svg");
    if (brandIcon) {
        const logo = document.createElement("img");
        logo.src = brandLogoUrl.href;
        logo.alt = "";
        logo.setAttribute("aria-hidden", "true");
        logo.className = "site-brand-logo h-8 w-8 rounded-full object-contain p-0.5";
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

function renderUpcomingStreams(container, streams) {
    if (!container) return;
    container.replaceChildren();

    const channels = [
        { id: "UCzDVvHcpWnu510JRLGnK-qg", name: "Main Channel" },
        { id: "UCMxGPWLjDHRQ9xoLHCXd45g", name: "Gaming Channel" },
    ];

    for (const channel of channels) {
        const channelStreams = streams.filter((stream) => stream.channelId === channel.id);
        if (channelStreams.length === 0) {
            const card = document.createElement("article");
            card.className = "upcoming-stream-card";

            const heading = document.createElement("p");
            heading.className = "upcoming-stream-channel";
            heading.textContent = channel.name;

            const message = document.createElement("p");
            message.className = "text-cn-muted";
            message.textContent = "No upcoming live streams are scheduled right now.";

            card.append(heading, message);
            container.appendChild(card);
            continue;
        }

        for (const stream of channelStreams) {
            const card = document.createElement("article");
            card.className = "upcoming-stream-card";

            const heading = document.createElement("p");
            heading.className = "upcoming-stream-channel";
            heading.textContent = channel.name;

            const title = document.createElement("h3");
            title.className = "upcoming-stream-title";
            title.textContent = stream.title;

            const schedule = document.createElement("p");
            schedule.className = "upcoming-stream-time";
            const scheduledStart = new Date(stream.scheduledStartTime);
            schedule.textContent = `Upcoming live stream - ${new Intl.DateTimeFormat(
                undefined,
                {
                    dateStyle: "full",
                    timeStyle: "short",
                },
            ).format(scheduledStart)}`;

            const link = document.createElement("a");
            link.className = "upcoming-stream-link";
            link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(stream.videoId)}`;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "View scheduled stream";

            card.append(heading, title, schedule, link);
            container.appendChild(card);
        }
    }
}

function updateCurrentLiveStream(liveStream) {
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
    const streamTitle = document.getElementById("stream-title");
    if (streamTitle) streamTitle.textContent = title;

    if (liveSection) {
        liveSection.classList.toggle("is-visible", isLive);
    }

    if (liveLayout && offlineBox) {
        document.getElementById("offline-title").textContent = isLive
            ? `${liveStream.channelName} is live`
            : "No live stream right now";
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
    }

    setIframeSource(
        livePlayer,
        isLive ? `https://www.youtube.com/embed/${encodeURIComponent(liveStream.videoId)}?autoplay=1` : "",
    );
    setIframeSource(
        liveChat,
        isLive
            ? `https://www.youtube.com/live_chat?v=${encodeURIComponent(liveStream.videoId)}&embed_domain=${encodeURIComponent(window.location.hostname)}`
            : "",
    );
    document.getElementById("status-wrap")?.classList.toggle("is-live", isLive);
}

function setIframeSource(iframe, source) {
    if (iframe && iframe.getAttribute("src") !== source) {
        iframe.src = source;
    }
}

async function updateStreamSchedule() {
    try {
        const url = new URL(liveStatusUrl);
        url.searchParams.set("v", Date.now());
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Stream schedule request failed: ${response.status}`);
        }

        const { liveStreams, upcomingStreams } = await response.json();
        const validStreams = (streams, isUpcoming = false) => Array.isArray(streams)
            && streams.every((stream) => (
                stream
                && typeof stream.videoId === "string"
                && typeof stream.title === "string"
                && typeof stream.channelId === "string"
                && typeof stream.channelName === "string"
                && (!isUpcoming
                    || (typeof stream.scheduledStartTime === "string"
                        && Number.isFinite(Date.parse(stream.scheduledStartTime))))
            ));
        if (!validStreams(liveStreams) || !validStreams(upcomingStreams, true)) {
            throw new Error("Stream schedule data has an invalid format.");
        }
        const futureUpcomingStreams = upcomingStreams.filter(
            (stream) => Date.parse(stream.scheduledStartTime) > Date.now(),
        );

        updateCurrentLiveStream(liveStreams[0] ?? null);
        renderUpcomingStreams(
            document.getElementById("home-upcoming-streams"),
            futureUpcomingStreams,
        );
        renderUpcomingStreams(
            document.getElementById("live-upcoming-streams"),
            futureUpcomingStreams,
        );
    } catch (error) {
        console.error("Could not load stream schedule:", error);
        document.querySelectorAll("#live-nav-link").forEach((link) => {
            link.classList.remove("is-live");
        });
        const streamTitle = document.getElementById("stream-title");
        if (streamTitle) streamTitle.textContent = "Live status unavailable";
        const liveStatusBanner = document.getElementById("live-status-banner");
        if (liveStatusBanner) liveStatusBanner.textContent = "Live status unavailable";
        const liveLayout = document.getElementById("live-layout");
        if (liveLayout) liveLayout.style.display = "none";
        const offlineBox = document.getElementById("offline-box");
        if (offlineBox) {
            offlineBox.style.display = "block";
            const offlineTitle = document.getElementById("offline-title");
            if (offlineTitle) offlineTitle.textContent = "Live status unavailable";
            const offlineMessage = document.getElementById("offline-message");
            if (offlineMessage) {
                offlineMessage.textContent = "Please check the YouTube channels directly while the live status is unavailable.";
            }
        }
        const containers = [
            document.getElementById("home-upcoming-streams"),
            document.getElementById("live-upcoming-streams"),
        ];
        containers
            .filter(Boolean)
            .forEach((container) => {
                container.replaceChildren();
                const message = document.createElement("p");
                message.className = "text-cn-muted";
                message.textContent = "Upcoming stream schedule is unavailable. Please check the YouTube channels.";
                container.appendChild(message);
            });
    }
}

updateStreamSchedule();
window.setInterval(updateStreamSchedule, 120000);
