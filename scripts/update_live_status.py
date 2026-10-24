import json
import urllib.request
from collections.abc import Iterator
from datetime import datetime, timezone
from pathlib import Path


CHANNELS = (
    ("UCMxGPWLjDHRQ9xoLHCXd45g", "Gaming Channel"),
    ("UCzDVvHcpWnu510JRLGnK-qg", "Main Channel"),
)
STATUS_FILE = Path(__file__).resolve().parents[1] / "live-status.json"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)


def fetch(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def find_live_stream() -> dict[str, str] | None:
    for channel_id, channel_name in CHANNELS:
        page = fetch(f"https://www.youtube.com/channel/{channel_id}/live")
        data_start = page.find("var ytInitialData = ")
        if data_start == -1:
            raise ValueError(f"Could not read live page for {channel_name}")
        data_start += len("var ytInitialData = ")
        data_end = page.find(";</script>", data_start)
        if data_end == -1:
            raise ValueError(f"Could not read live page for {channel_name}")

        data = json.loads(page[data_start:data_end])
        live_tab = find_live_tab(data)
        if live_tab is None:
            raise ValueError(f"Could not find the live tab for {channel_name}")

        for video in find_lockup_videos(live_tab.get("contents", [])):
            video_id = video.get("contentId")
            metadata = video.get("metadata")
            lockup_metadata = (
                metadata.get("lockupMetadataViewModel")
                if isinstance(metadata, dict)
                else None
            )
            video_title = (
                lockup_metadata.get("title")
                if isinstance(lockup_metadata, dict)
                else None
            )
            title = (
                video_title.get("content")
                if isinstance(video_title, dict)
                else None
            )
            if not isinstance(video_id, str) or not isinstance(title, str):
                raise ValueError(f"Live video data is missing for {channel_name}")

            if has_live_badge(video):
                return {
                    "videoId": video_id,
                    "title": title,
                    "channelId": channel_id,
                    "channelName": channel_name,
                }

    return None


def find_live_tab(value: object) -> dict[str, object] | None:
    if isinstance(value, dict):
        tab = value.get("tabRenderer")
        if (
            isinstance(tab, dict)
            and tab.get("title") == "Live"
            and tab.get("selected") is True
        ):
            content = tab.get("content")
            if isinstance(content, dict):
                rich_grid = content.get("richGridRenderer")
                if isinstance(rich_grid, dict):
                    return rich_grid
                return None
        for child in value.values():
            result = find_live_tab(child)
            if result is not None:
                return result
    elif isinstance(value, list):
        for child in value:
            result = find_live_tab(child)
            if result is not None:
                return result
    return None


def find_lockup_videos(value: object) -> Iterator[dict[str, object]]:
    if isinstance(value, dict):
        video = value.get("lockupViewModel")
        if (
            isinstance(video, dict)
            and video.get("contentType") == "LOCKUP_CONTENT_TYPE_VIDEO"
        ):
            yield video
        for child in value.values():
            yield from find_lockup_videos(child)
    elif isinstance(value, list):
        for child in value:
            yield from find_lockup_videos(child)


def has_live_badge(video: dict[str, object]) -> bool:
    badges: list[dict[str, object]] = []

    def collect_badges(value: object) -> None:
        if isinstance(value, dict):
            badge = value.get("thumbnailBadgeViewModel")
            if isinstance(badge, dict):
                badges.append(badge)
            for child in value.values():
                collect_badges(child)
        elif isinstance(value, list):
            for child in value:
                collect_badges(child)

    collect_badges(video.get("contentImage", {}))
    return any(
        isinstance(badge.get("text"), str)
        and badge["text"].strip().upper() == "LIVE"
        for badge in badges
    )


def main() -> None:
    live_stream = find_live_stream()
    current = json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    if current.get("liveStream") == live_stream:
        print("Live stream status is unchanged.")
        return

    updated = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "liveStream": live_stream,
    }
    STATUS_FILE.write_text(
        json.dumps(updated, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("Updated live stream status.")


if __name__ == "__main__":
    main()
