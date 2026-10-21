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
            "indirect_podcast_author_link",
            "publisher_direct_watch_link_verified_by_click",
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
    series_path = ROOT / "video/publisher-series-catalog.json"
    if series_path.is_file():
        collection = json.loads(series_path.read_text(encoding="utf-8"))
        assert collection["schema_version"] == "1.0.0"
        assert collection["count"] == len(collection["sources"])
        assert collection["status"] == "links_only_not_rehosted"
        publisher_urls, publisher_ids = set(), set()
        for row in collection["sources"]:
            assert row["id"] not in publisher_ids
            publisher_ids.add(row["id"])
            assert row["url"] not in publisher_urls
            publisher_urls.add(row["url"])
            assert row["url"].startswith("https://")
            assert "youtube.com/watch" not in row["url"], "publisher pages must not claim YouTube video IDs"
            assert row["direct_video_ids_known"] is False
            assert row["source_checked"] == "verified_publisher_page"
            assert row["score"] >= 0 and row["score"] <= 100
            assert row["skills"] and row["topics"]
            assert row["known_episodes"] >= 1
        print(f"OK: {len(publisher_ids)} distinct external publisher video-series URLs, not mixed with YouTube IDs")
    episode_path = ROOT / "video/publisher-episode-catalog.json"
    if episode_path.is_file():
        index = json.loads(episode_path.read_text(encoding="utf-8"))
        assert index["schema_version"] == "1.0.0"
        assert index["kind"] == "publisher-hosted-individual-video-episodes-not-youtube"
        used_urls, used_ids = set(), set()
        for row in index["items"]:
            assert row["id"] not in used_ids
            used_ids.add(row["id"])
            assert row["url"] not in used_urls
            used_urls.add(row["url"])
            assert re.fullmatch(r"https://areena[.]yle[.]fi/1-[0-9]+", row["url"])
            assert row["provider"] == "yle_areena"
            assert row["duration_seconds"] > 0
            assert 0 <= row["expert_product_fit_score_100"] <= 100
            assert row["embedding_allowed"] is None
            assert row["playback_verified"] is False
            assert row["review"] == "teacher_review_pending"
            assert row["original_prompt_fi"] and row["topics"] and row["skills"]
        print(f"OK: {len(used_ids)} distinct Yle Areena episode URLs, separate from YouTube")
    mock_path = ROOT / "video/yki-mock-simulation-sources.json"
    if mock_path.is_file():
        mock = json.loads(mock_path.read_text(encoding="utf-8"))
        assert mock["schema_version"] == "1.0.0"
        assert mock["official_2027_policy"]["official_examples_not_real_past_exam_items"] is True
        classified = {i["youtube_video_id"]: i for i in data["items"]}
        linked = set()
        for v in mock["mock_youtube_videos"]:
            video_id = v["youtube_video_id"]
            assert video_id not in linked
            linked.add(video_id)
            assert video_id in classified, "YKI mock references missing catalog video"
            assert v["url"] == f"https://www.youtube.com/watch?v={video_id}"
            assert v["is_full_four_skill_mock"] is False
            assert v["is_verified_digital_2027_mock"] is False
            assert v["teacher_review"] == "pending"
            assert classified[video_id]["model_answers_start_seconds"] == v["model_answers_start_seconds"]
            assert classified[video_id]["mock_classification"]
            assert 0 <= v["fit_100"] <= 100
        assert len(mock["official_organizer_samples"]) == 5
        assert all(s["creator"] == "University of Jyväskylä / SOLKI" for s in mock["official_organizer_samples"])
        assert all(s["url"].startswith("https://ykitesti.solki.jyu.fi/") for s in mock["official_organizer_samples"])
        assert len(set(s["url"] for s in mock["official_organizer_samples"])) == 5
        assert mock["implementation_rules"]
        print(f"OK: {len(linked)} classified timed/section YKI video mocks; 5 distinct SOLKI official sample page URLs; no full-digital-2027 claims")
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
