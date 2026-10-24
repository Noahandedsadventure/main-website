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


def find_streams() -> tuple[
    list[dict[str, str | bool]],
    list[dict[str, str]],
]:
    live_streams = []
    upcoming_streams = []
    for channel_id, channel_name in CHANNELS:
        page = fetch(f"https://www.youtube.com/channel/{channel_id}/streams")
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

        seen_video_ids = set()
        for video in find_lockup_videos(live_tab.get("contents", [])):
            video_id = video.get("contentId")
            if not isinstance(video_id, str) or video_id in seen_video_ids:
                continue
            seen_video_ids.add(video_id)

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
                raise ValueError(f"Stream data is missing for {channel_name}")

            stream = {
                "videoId": video_id,
                "title": title,
                "channelId": channel_id,
                "channelName": channel_name,
            }
            if has_badge(video, "LIVE"):
                live_streams.append(stream)
            elif has_badge(video, "UPCOMING"):
                watch_page = fetch(
                    f"https://www.youtube.com/watch?v={video_id}"
                )
                scheduled_start = find_scheduled_start(watch_page)
                if scheduled_start is None:
                    raise ValueError(
                        f"Scheduled start time is missing for {channel_name}"
                    )
                if scheduled_start > datetime.now(timezone.utc):
                    upcoming_streams.append(
                        {
                            **stream,
                            "scheduledStartTime": scheduled_start.isoformat(),
                        }
                    )
                else:
                    live_streams.append(
                        {
                            **stream,
                            "scheduledStartTime": scheduled_start.isoformat(),
                            "scheduledStartReached": True,
                        }
                    )

    live_streams.sort(
        key=lambda stream: stream.get("scheduledStartReached") is True
    )
    upcoming_streams.sort(key=lambda stream: stream["scheduledStartTime"])
    return live_streams, upcoming_streams


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


def has_badge(video: dict[str, object], expected_text: str) -> bool:
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
        and badge["text"].strip().upper() == expected_text
        for badge in badges
    )


def find_scheduled_start(page: str) -> datetime | None:
    marker = "var ytInitialPlayerResponse = "
    data_start = page.find(marker)
    if data_start == -1:
        raise ValueError("Could not read the scheduled stream video page")
    data_start += len(marker)

    try:
        player_response, _ = json.JSONDecoder().raw_decode(page[data_start:])
    except json.JSONDecodeError as error:
        raise ValueError("Could not parse the scheduled stream video page") from error

    playability = player_response.get("playabilityStatus", {})
    live_streamability = (
        playability.get("liveStreamability", {})
        if isinstance(playability, dict)
        else {}
    )
    renderer = (
        live_streamability.get("liveStreamabilityRenderer", {})
        if isinstance(live_streamability, dict)
        else {}
    )
    offline_slate = (
        renderer.get("offlineSlate", {}).get("liveStreamOfflineSlateRenderer")
        if isinstance(renderer, dict)
        and isinstance(renderer.get("offlineSlate"), dict)
        else None
    )
    timestamp = (
        offline_slate.get("scheduledStartTime")
        if isinstance(offline_slate, dict)
        else None
    )
    if isinstance(timestamp, str) and timestamp.isdigit():
        return datetime.fromtimestamp(int(timestamp), tz=timezone.utc)

    microformat = player_response.get("microformat", {})
    player_microformat = (
        microformat.get("playerMicroformatRenderer", {})
        if isinstance(microformat, dict)
        else {}
    )
    broadcast_details = (
        player_microformat.get("liveBroadcastDetails", {})
        if isinstance(player_microformat, dict)
        else {}
    )
    start_timestamp = (
        broadcast_details.get("startTimestamp")
        if isinstance(broadcast_details, dict)
        else None
    )
    if isinstance(start_timestamp, str):
        return datetime.fromisoformat(start_timestamp.replace("Z", "+00:00"))
    return None


def main() -> None:
    live_streams, upcoming_streams = find_streams()
    current = json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    if (
        current.get("liveStreams", []) == live_streams
        and current.get("upcomingStreams", []) == upcoming_streams
    ):
        print("Live and upcoming stream status is unchanged.")
        return

    updated = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "liveStreams": live_streams,
        "upcomingStreams": upcoming_streams,
    }
    STATUS_FILE.write_text(
        json.dumps(updated, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("Updated live and upcoming stream status.")


if __name__ == "__main__":
    main()
