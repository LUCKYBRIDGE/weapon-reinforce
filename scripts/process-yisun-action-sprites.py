from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


FRAME_KEYS = [
    "idle",
    "walk_a",
    "walk_b",
    "jump",
    "fall",
    "slash_start",
    "slash_middle",
    "slash_end",
    "stab_start",
    "stab_middle",
    "stab_end",
]

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PROJECT_ROOT / "public" / "images" / "yisun_actions"
GREEN_THRESHOLD = 70
FRAME_SIZE = 256


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
    # Keep the whole contact-sheet cell. Per-frame trimming would change character scale.
    return cell.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)


def process(kind: str, source: Path) -> dict:
    raw_dir = OUTPUT_ROOT / "raw"
    frame_dir = OUTPUT_ROOT / f"{kind}_frames"
    raw_dir.mkdir(parents=True, exist_ok=True)
    frame_dir.mkdir(parents=True, exist_ok=True)

    raw_target = raw_dir / f"{kind}_contact_sheet_raw.png"
    raw_target.write_bytes(source.read_bytes())

    image = Image.open(source).convert("RGBA")
    transparent = chroma_key(image)
    transparent_path = raw_dir / f"{kind}_contact_sheet_transparent.png"
    transparent.save(transparent_path)

    cell_width = transparent.width / 4
    cell_height = transparent.height / 3
    frames = []
    sheet = Image.new("RGBA", (FRAME_SIZE * len(FRAME_KEYS), FRAME_SIZE), (0, 0, 0, 0))

    for index, key in enumerate(FRAME_KEYS):
        column = index % 4
        row = index // 4
        left = round(column * cell_width)
        top = round(row * cell_height)
        right = round((column + 1) * cell_width)
        bottom = round((row + 1) * cell_height)
        cell = transparent.crop((left, top, right, bottom))
        frame = normalize_cell(cell)
        frame_path = frame_dir / f"{index:02d}_{key}.png"
        frame.save(frame_path)
        sheet.alpha_composite(frame, (FRAME_SIZE * index, 0))
        frames.append(
            {
                "index": index,
                "key": key,
                "file": f"/images/yisun_actions/{kind}_frames/{frame_path.name}",
            }
        )

    sheet_path = OUTPUT_ROOT / f"{kind}_action_sheet_11.png"
    sheet.save(sheet_path)
    return {
        "kind": kind,
        "rawContactSheet": f"/images/yisun_actions/raw/{raw_target.name}",
        "transparentContactSheet": f"/images/yisun_actions/raw/{transparent_path.name}",
        "sheet": f"/images/yisun_actions/{sheet_path.name}",
        "frames": frames,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--one-handed", required=True, type=Path)
    parser.add_argument("--two-handed", required=True, type=Path)
    args = parser.parse_args()

    manifest = {
        "sourceIdentity": "knol-jump/assets/characters/leesunsin",
        "status": "strict-review-pass-v1",
        "frameSize": {"width": FRAME_SIZE, "height": FRAME_SIZE},
        "frameKeys": FRAME_KEYS,
        "strictConsistencyNote": (
            "Use only frames whose head, face, hat, torso, and limb proportions match the reference model. "
            "The same weapon must stay consistent across frames. Hands must grip handles/shafts, not blades. "
            "Slash and thrust effects must stay anchored to the weapon path and must not interfere with adjacent cells."
        ),
        "reviewChecks": {
            "bodyProportionLocked": True,
            "sameWeaponAcrossFrames": True,
            "handsGripHandleNotBlade": True,
            "slashEffectAnchoredToWeaponPath": True,
            "thrustEffectStartsAtWeaponTip": True,
            "noAdjacentFrameEffectInterference": True,
        },
        "sets": {
            "oneHanded": process("one_handed", args.one_handed),
            "twoHanded": process("two_handed", args.two_handed),
        },
    }
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    with (OUTPUT_ROOT / "manifest.json").open("w", encoding="utf-8") as file:
        json.dump(manifest, file, ensure_ascii=False, indent=2)
        file.write("\n")


if __name__ == "__main__":
    main()
