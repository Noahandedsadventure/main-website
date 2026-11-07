# Noah & Ed's Train Adventures

This website is for the YouTube channel Noah & Ed's Train Adventures.

## Subscriber count

The main YouTube channel's subscriber count appears in every page's header and refreshes every 15 minutes while a page is open. The count is retrieved from the YouTube Data API in `subscriber-count.js`.

## Gallery setup

Add photos to the `gallery/photos` folder and then add matching image cards to `gallery/index.html`.

Example:

- `gallery/photos/train-shot-1.jpg`
- `gallery/photos/train-shot-2.jpg`

Then use a path like this in the HTML:

```html
<img src="photos/train-shot-1.jpg" alt="Train shot 1">
```

## Live stream status

Live and upcoming stream status are refreshed by the scheduled GitHub Actions workflow in `.github/workflows/update-live-status.yml`, every five minutes at minutes 2, 7, 12, and so on. It checks the public YouTube Live tab and authoritative scheduled start times for the main channel without using the YouTube Data API quota, then publishes the results to `live-status.json`. Past scheduled events are excluded from the schedule, and the Live page switches to the scheduled stream's player when its start time arrives. GitHub Actions scheduled runs are best-effort and may be delayed during periods of high load.
