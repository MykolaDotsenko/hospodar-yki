#!/usr/bin/env python3
"""Static integrity checks for a link-only YouTube learning catalog.

Does not test that the external video is still available, embeddable, or subtitled.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "video/youtube-catalog.json"
VIDEO_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def main() -> int:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    assert data["catalog_type"] == "youtube_watch_links_only"
    assert data["schema_version"] == "1.0.0"
    assert len(data["items"]) >= 1, "catalog must not be empty"
    assert "Do not download" in data["copyright"], "rights warning is required"
    video_ids, item_ids = set(), set()
    for item in data["items"]:
        video_id = item["youtube_video_id"]
        assert VIDEO_RE.fullmatch(video_id), item["id"]
        assert video_id not in video_ids, "duplicate YouTube video ID"
        video_ids.add(video_id)
        assert item["id"] not in item_ids, "duplicate item ID"
        item_ids.add(item["id"])
        assert item["watch_url"] == f"https://www.youtube.com/watch?v={video_id}", item["id"]
        assert item["provider"] == "youtube", item["id"]
        assert item["title"].strip() and item["creator"].strip()
        assert 0 <= item["product_fit_score_100"] <= 100
        assert item["skills"] and item["yki_topics"] and item["why_useful"].strip()
        assert item["teacher_review"] == "pending", "Never mark reviewed without manual review"
        assert item["source_verification"] in {
            "watch_page_title_description_seen",
            "watch_id_creator_and_description_seen_youtube_title_not_returned",
            "indirect_syndicated_page_not_youtube_page",
        }
        assert item["title_is_editorial_summary"] == (
            item["source_verification"] ==
            "watch_id_creator_and_description_seen_youtube_title_not_returned"
        )
        assert item["playback_verified"] is False
        assert item["embeddable"] is None
        assert item["subtitles_fi_verified"] is False
        assert item["transcript_locally_stored"] is False
        assert item["official_yki_material"] is False
        assert item["learning_mode_only"] is True
        assert item["license"] == "youtube_link_only_no_redistribution_license_assumed"
        assert 1 <= len(item["original_question_seeds"]) <= 5
        for seed in item["original_question_seeds"]:
            assert seed["prompt_fi"].strip()
            assert seed["answer_key"] is None
            assert seed["status"] == "original_draft_pending_teacher_review"
        seen_segs = set()
        for c in item["chapters"]:
            start = c["start_seconds"]
            end = c["end_seconds"]
            assert isinstance(start, int) and start >= 0, item["id"]
            assert end is None or isinstance(end, int) and end > start
            assert (start, end) not in seen_segs
            seen_segs.add((start, end))
    print(f"OK: {len(item_ids)} distinct YouTube watch links, " +
          f"{sum(len(i['chapters']) for i in data['items'])} chapter markers; " +
          "all study items correctly labeled pending external/player review")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print(f"CATALOG VALIDATION FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
