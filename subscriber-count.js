const subscriberChannelId = "UCzDVvHcpWnu510JRLGnK-qg";
const subscriberApiKey = "AIzaSyDzXrJHFeiuBP5w6H7pT6KGrFY7q_UGn4A";

function createSubscriberCountLink() {
    const link = document.createElement("a");
    link.className = "site-subscriber-count";
    link.href = `https://www.youtube.com/channel/${subscriberChannelId}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-live", "polite");
    link.setAttribute("aria-label", "Loading subscriber count");

    const label = document.createElement("span");
    label.className = "site-subscriber-label";
    label.textContent = "Subs";

    const count = document.createElement("strong");
    count.dataset.subscriberCountValue = "";
    count.textContent = "Loading...";

    link.append(label, count);
    return link;
}

const subscriberCountLinks = [];
document.querySelectorAll("nav > div").forEach((navInner) => {
    const brand = navInner.querySelector(":scope > a");
    if (!brand) return;

    const link = createSubscriberCountLink();
    navInner.insertBefore(link, brand.nextSibling);
    subscriberCountLinks.push(link);
});

if (subscriberCountLinks.length === 0) {
    const topbar = document.querySelector(".topbar");
    if (topbar) {
        const link = createSubscriberCountLink();
        const dateMark = topbar.querySelector(".date-mark");
        topbar.insertBefore(link, dateMark ?? null);
        subscriberCountLinks.push(link);
    }
}

async function updateSubscriberCount() {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "statistics");
    url.searchParams.set("id", subscriberChannelId);
    url.searchParams.set("key", subscriberApiKey);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Subscriber count request failed: ${response.status}`);
        }

        const data = await response.json();
        const subscriberCount = data.items?.[0]?.statistics?.subscriberCount;
        if (typeof subscriberCount !== "string" || !/^\d+$/.test(subscriberCount)) {
            throw new Error("YouTube returned an invalid subscriber count.");
        }

        const formattedCount = new Intl.NumberFormat().format(Number(subscriberCount));
        subscriberCountLinks.forEach((link) => {
            link.querySelector("[data-subscriber-count-value]").textContent = formattedCount;
            link.setAttribute("aria-label", `${formattedCount} subscribers. Visit the YouTube channel.`);
        });
    } catch (error) {
        console.error("Could not load YouTube subscriber count:", error);
        subscriberCountLinks.forEach((link) => {
            link.querySelector("[data-subscriber-count-value]").textContent = "Unavailable";
            link.setAttribute("aria-label", "Subscriber count unavailable. Visit the YouTube channel.");
        });
    }
}

if (subscriberCountLinks.length > 0) {
    updateSubscriberCount();
    window.setInterval(updateSubscriberCount, 15 * 60 * 1000);
}
