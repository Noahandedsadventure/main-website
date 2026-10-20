(() => {
    const localDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Winnipeg',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());
    const dateParts = Object.fromEntries(localDate.map(({ type, value }) => [type, value]));
    const isAnniversaryDay = dateParts.month === '03' && dateParts.day === '09';
    const isAnniversaryPage = window.location.pathname.endsWith('/anniversary.html');

    if (isAnniversaryPage && !isAnniversaryDay) {
        window.location.replace('index.html');
    } else if (!isAnniversaryPage && isAnniversaryDay) {
        window.location.replace('anniversary.html');
    }
})();