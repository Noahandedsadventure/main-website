# Noah & Ed's Train Adventures

This website is for the YouTube channel Noah & Ed's Train Adventures.

## Gallery setup

Add photos to the `gallery/photos` folder and then add matching image cards to `gallery/index.html`.

Example:

- `gallery/photos/train-shot-1.jpg`
- `gallery/photos/train-shot-2.jpg`

Then use a path like this in the HTML:

```html
<img src="photos/train-shot-1.jpg" alt="Train shot 1">
```

## Mods setup

Put downloadable mod files in `mods/downloads` and add a download card to `mods/index.html` for each file. Link to the file with a relative path and the `download` attribute, for example:

```html
<a href="downloads/example-mod.zip" download>Download the mod</a>
```

All mods listed on the page depend on Immersive Railroading (IR) and require all needed IR files.

## Live stream status

Live and upcoming stream status are refreshed by the scheduled GitHub Actions workflow in `.github/workflows/update-live-status.yml`. It checks both channels' public YouTube Live tabs and authoritative scheduled start times without using the YouTube Data API quota, then publishes the results to `live-status.json`. Past scheduled events are excluded from the schedule, and the Live page switches to the scheduled stream's player when its start time arrives.
