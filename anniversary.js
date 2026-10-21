(() => {
    const localDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Winnipeg',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());
    const dateParts = Object.fromEntries(localDate.map(({ type, value }) => [type, value]));
    const isAnniversaryDay = dateParts.month === '03' && dateParts.day === '09';
    const siteRoot = new URL('.', document.currentScript.src);
    const anniversaryUrl = new URL('anniversary/', siteRoot);
    const currentPath = window.location.pathname.endsWith('/')
        ? window.location.pathname
        : `${window.location.pathname}/`;
    const isAnniversaryPage = currentPath === anniversaryUrl.pathname;

    if (isAnniversaryPage && !isAnniversaryDay) {
        window.location.replace(siteRoot.href);
    } else if (!isAnniversaryPage && isAnniversaryDay) {
        window.location.replace(anniversaryUrl.href);
    }
})();