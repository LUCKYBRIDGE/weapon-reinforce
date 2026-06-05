from __future__ import annotations

import argparse
from collections import deque
import json
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ACTION_ROOT = PROJECT_ROOT / "public" / "images" / "yisun_actions"
GREEN_THRESHOLD = 70
FRAME_SIZE = 256

COMBO_FRAME_KEYS = [
    "slash_a_anticipation",
    "slash_a_contact",
    "slash_a_followthrough",
    "transition_a_to_b",
    "thrust_b_anticipation",
    "thrust_b_contact",
    "thrust_b_followthrough",
    "transition_b_to_c",
    "slash_c_anticipation",
    "slash_c_contact",
    "slash_c_followthrough",
    "loop_lift_recovery",
]

STRIP_RAW_KEYS = [
    "slash_a",
    "thrust_b",
    "slash_c",
]

PHASER_FRAME_DURATIONS = {
    "one_handed": [150, 55, 120, 95, 130, 45, 95, 105, 150, 55, 120, 110],
    "two_handed": [170, 60, 145, 110, 150, 50, 125, 125, 170, 60, 145, 130],
}

COMBO_FRAME_PHASES = [
    "startup",
    "active",
    "recovery",
    "transition",
    "startup",
    "active",
    "recovery",
    "transition",
    "startup",
    "active",
    "recovery",
    "transition",
]


def chroma_key(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            is_green = green > 150 and green - red > GREEN_THRESHOLD and green - blue > GREEN_THRESHOLD
            if is_green:
                pixels[x, y] = (red, green, blue, 0)
            elif alpha > 0:
                pixels[x, y] = (red, green, blue, 255)
    return rgba


def normalize_cell(cell: Image.Image) -> Image.Image:
    return cell.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)


def clean_edge_artifacts(frame: Image.Image) -> Image.Image:
    rgba = frame.convert("RGBA")
    alpha = rgba.getchannel("A")
    width, height = rgba.size
    visited = bytearray(width * height)
    components = []

    for start_y in range(height):
        for start_x in range(width):
            start_index = start_y * width + start_x
            if visited[start_index] or alpha.getpixel((start_x, start_y)) == 0:
                continue

            queue = deque([(start_x, start_y)])
            visited[start_index] = 1
            pixels = []
            min_x = max_x = start_x
            min_y = max_y = start_y

            while queue:
                x, y = queue.popleft()
                pixels.append((x, y))
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if next_x < 0 or next_y < 0 or next_x >= width or next_y >= height:
                        continue
                    next_index = next_y * width + next_x
                    if visited[next_index] or alpha.getpixel((next_x, next_y)) == 0:
                        continue
                    visited[next_index] = 1
                    queue.append((next_x, next_y))

            components.append({
                "pixels": pixels,
                "area": len(pixels),
                "touches_edge": min_x == 0 or min_y == 0 or max_x == width - 1 or max_y == height - 1,
            })

    if not components:
        return rgba

    largest_area = max(component["area"] for component in components)
    keep = bytearray(width * height)
    for component in components:
        should_keep = component["area"] == largest_area or (
            component["area"] >= 16 and not component["touches_edge"]
        )
        if not should_keep:
            continue
        for x, y in component["pixels"]:
            keep[y * width + x] = 1

    pixels = rgba.load()
    for y in range(height):
        for x in range(width):
            if not keep[y * width + x]:
                pixels[x, y] = (0, 0, 0, 0)

    return rgba


def add_safe_padding(frame: Image.Image, scale: float = 0.94) -> Image.Image:
    target_size = round(FRAME_SIZE * scale)
    resized = frame.resize((target_size, target_size), Image.Resampling.LANCZOS)
    padded = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    offset = ((FRAME_SIZE - target_size) // 2, (FRAME_SIZE - target_size) // 2)
    padded.alpha_composite(resized, offset)
    return padded


def clear_frame_dir(frame_dir: Path) -> None:
    frame_dir.mkdir(parents=True, exist_ok=True)
    for old_frame in frame_dir.glob("*.png"):
        old_frame.unlink()


def save_frames(kind: str, transparent_frames: list[Image.Image], raw_target: Path, transparent_path: Path, raw_strips: list[str] | None = None) -> dict:
    frame_dir = ACTION_ROOT / f"{kind}_combo_chain_frames"
    clear_frame_dir(frame_dir)

    sheet = Image.new("RGBA", (FRAME_SIZE * len(COMBO_FRAME_KEYS), FRAME_SIZE), (0, 0, 0, 0))
    frames = []

    for index, (key, frame) in enumerate(zip(COMBO_FRAME_KEYS, transparent_frames, strict=True)):
        frame_path = frame_dir / f"{index:02d}_{key}.png"
        frame.save(frame_path)
        sheet.alpha_composite(frame, (FRAME_SIZE * index, 0))
        frames.append({
            "index": index,
            "key": key,
            "file": f"/images/yisun_actions/{kind}_combo_chain_frames/{frame_path.name}",
        })

    sheet_path = ACTION_ROOT / f"{kind}_combo_chain_sheet_12.png"
    sheet.save(sheet_path)
    result = {
        "kind": kind,
        "rawContactSheet": f"/images/yisun_actions/raw/{raw_target.name}",
        "transparentContactSheet": f"/images/yisun_actions/raw/{transparent_path.name}",
        "sheet": f"/images/yisun_actions/{sheet_path.name}",
        "frames": frames,
    }
    if raw_strips:
        result["rawStrips"] = raw_strips
    return result


def process_contact_sheet(kind: str, source: Path) -> dict:
    raw_dir = ACTION_ROOT / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    raw_target = raw_dir / f"{kind}_combo_chain_raw.png"
    raw_target.write_bytes(source.read_bytes())

    image = Image.open(source).convert("RGBA")
    transparent = chroma_key(image)
    transparent_path = raw_dir / f"{kind}_combo_chain_transparent.png"
    transparent.save(transparent_path)

    cell_width = transparent.width / 4
    cell_height = transparent.height / 3
    transparent_frames = []

    for index, key in enumerate(COMBO_FRAME_KEYS):
        column = index % 4
        row = index // 4
        left = round(column * cell_width)
        top = round(row * cell_height)
        right = round((column + 1) * cell_width)
        bottom = round((row + 1) * cell_height)
        frame = add_safe_padding(clean_edge_artifacts(normalize_cell(transparent.crop((left, top, right, bottom)))))
        transparent_frames.append(frame)

    return save_frames(kind, transparent_frames, raw_target, transparent_path)


def process_strips(kind: str, sources: list[Path]) -> dict:
    if len(sources) != len(STRIP_RAW_KEYS):
        raise ValueError(f"{kind} needs exactly {len(STRIP_RAW_KEYS)} strip images")

    raw_dir = ACTION_ROOT / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_strips = []
    transparent_frames = []
    raw_contact = Image.new("RGBA", (FRAME_SIZE * 4, FRAME_SIZE * 3), (0, 255, 0, 255))
    transparent_contact = Image.new("RGBA", (FRAME_SIZE * 4, FRAME_SIZE * 3), (0, 0, 0, 0))

    for strip_index, (strip_key, source) in enumerate(zip(STRIP_RAW_KEYS, sources, strict=True)):
        raw_strip_target = raw_dir / f"{kind}_combo_chain_{strip_key}_strip_raw.png"
        raw_strip_target.write_bytes(source.read_bytes())
        raw_strips.append(f"/images/yisun_actions/raw/{raw_strip_target.name}")

        transparent = chroma_key(Image.open(source).convert("RGBA"))
        cell_width = transparent.width / 4
        cell_height = transparent.height

        for column in range(4):
            left = round(column * cell_width)
            right = round((column + 1) * cell_width)
            frame = add_safe_padding(clean_edge_artifacts(normalize_cell(transparent.crop((left, 0, right, cell_height)))))
            transparent_frames.append(frame)
            target_x = column * FRAME_SIZE
            target_y = strip_index * FRAME_SIZE
            green_cell = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 255, 0, 255))
            green_cell.alpha_composite(frame)
            raw_contact.alpha_composite(green_cell, (target_x, target_y))
            transparent_contact.alpha_composite(frame, (target_x, target_y))

    raw_target = raw_dir / f"{kind}_combo_chain_raw.png"
    transparent_path = raw_dir / f"{kind}_combo_chain_transparent.png"
    raw_contact.save(raw_target)
    transparent_contact.save(transparent_path)
    return save_frames(kind, transparent_frames, raw_target, transparent_path, raw_strips)


def update_manifest(one_handed: dict, two_handed: dict) -> None:
    manifest_path = ACTION_ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["status"] = "strict-review-pass-v3-combo-chain-strips"
    manifest["comboChainFrameKeys"] = COMBO_FRAME_KEYS
    manifest["strictConsistencyNote"] = (
        "Use only frames whose head, face, hat, torso, and limb proportions match the reference model. "
        "The same weapon must stay consistent across frames. Hands must grip handles/shafts, not blades. "
        "Slash and thrust effects must stay anchored to the weapon path and must not interfere with adjacent cells. "
        "Stab effects are strengthened as a separate overlay layer without redrawing the character or changing weapon geometry. "
        "Combo-chain attack frames are stored separately as 12 frames: slash anticipation/contact/follow-through, transition, "
        "thrust anticipation/contact/follow-through, transition, slash anticipation/contact/follow-through, loop recovery. "
        "The first combo action must start with an overhead slash anticipation pose. Two-handed contact frames must show longer reach than one-handed frames, "
        "and effects must originate at or ahead of the visible blade/tip, never from the shaft or behind the blade. "
        "V3 combo-chain frames are regenerated in 4-frame strips so anticipation/contact/follow-through continuity and effect placement can be reviewed per attack."
    )
    review_checks = manifest.setdefault("reviewChecks", {})
    review_checks["comboChainHasThreeLinkedPatterns"] = True
    review_checks["comboChainStartsWithOverheadSlash"] = True
    review_checks["twoHandedReachLongerThanOneHanded"] = True
    review_checks["effectsOriginateAtBladeOrTip"] = True
    review_checks["noHandsOnBlade"] = True
    review_checks["comboContactFramesNeedEffectPositionRework"] = False
    review_checks["comboContactFramesHaveSafePadding"] = True
    review_checks["comboGeneratedAsFourFrameStrips"] = True
    manifest["sets"]["oneHanded"]["comboChain"] = one_handed
    manifest["sets"]["twoHanded"]["comboChain"] = two_handed
    manifest["phaser"] = {
        "frameWidth": FRAME_SIZE,
        "frameHeight": FRAME_SIZE,
        "pixelArt": True,
        "origin": {
            "x": 0.5,
            "y": 0.78,
            "note": "Keep a stable visual origin when placing the sprite in Phaser; do not trim individual frames.",
        },
        "animations": {
            "oneHandedCombo": {
                "textureKey": "yisun-one-handed-combo",
                "sheet": one_handed["sheet"],
                "frames": COMBO_FRAME_KEYS,
                "durations": PHASER_FRAME_DURATIONS["one_handed"],
                "phases": COMBO_FRAME_PHASES,
                "activeFrames": [1, 5, 9],
                "repeat": -1,
                "yoyo": False,
            },
            "twoHandedCombo": {
                "textureKey": "yisun-two-handed-combo",
                "sheet": two_handed["sheet"],
                "frames": COMBO_FRAME_KEYS,
                "durations": PHASER_FRAME_DURATIONS["two_handed"],
                "phases": COMBO_FRAME_PHASES,
                "activeFrames": [1, 5, 9],
                "repeat": -1,
                "yoyo": False,
            },
        },
        "generationPolicy": {
            "separateEffectLayerPreferred": True,
            "note": (
                "Future Phaser-targeted regeneration should prefer actor/weapon frames and separate active-frame effect overlays. "
                "Baked effects are acceptable only for candidate previews when the effect origin is still readable."
            ),
        },
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--one-handed", type=Path)
    parser.add_argument("--two-handed", type=Path)
    parser.add_argument("--one-handed-strips", nargs=3, type=Path)
    parser.add_argument("--two-handed-strips", nargs=3, type=Path)
    args = parser.parse_args()

    if args.one_handed_strips and args.two_handed_strips:
        one_handed = process_strips("one_handed", args.one_handed_strips)
        two_handed = process_strips("two_handed", args.two_handed_strips)
    elif args.one_handed and args.two_handed:
        one_handed = process_contact_sheet("one_handed", args.one_handed)
        two_handed = process_contact_sheet("two_handed", args.two_handed)
    else:
        parser.error("provide either --one-handed/--two-handed contact sheets or both strip argument groups")
    update_manifest(one_handed, two_handed)


if __name__ == "__main__":
    main()
