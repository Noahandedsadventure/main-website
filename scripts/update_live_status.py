import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path


CHANNELS = (
    ("UCMxGPWLjDHRQ9xoLHCXd45g", "Gaming Channel"),
    ("UCzDVvHcpWnu510JRLGnK-qg", "Main Channel"),
)
ATOM = "{http://www.w3.org/2005/Atom}"
YOUTUBE = "{http://www.youtube.com/xml/schemas/2015}"
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
        feed_url = (
            "https://www.youtube.com/feeds/videos.xml"
            f"?channel_id={channel_id}"
        )
        feed = ET.fromstring(fetch(feed_url))
        entry = feed.find(f"{ATOM}entry")
        if entry is None:
            continue

        video_id = entry.findtext(f"{YOUTUBE}videoId")
        title = entry.findtext(f"{ATOM}title")
        if not video_id or not title:
            raise ValueError(f"Latest video data is missing for {channel_name}")

        watch_page = fetch(f"https://www.youtube.com/watch?v={video_id}")
        live_marker = re.search(r'"isLiveNow"\s*:\s*(true|false)', watch_page)
        if live_marker is None:
            raise ValueError(f"Could not determine live state for {channel_name}")
        if live_marker.group(1) == "true":
            return {
                "videoId": video_id,
                "title": title,
                "channelId": channel_id,
                "channelName": channel_name,
            }

    return None


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
