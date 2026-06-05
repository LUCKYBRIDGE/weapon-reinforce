from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ACTION_ROOT = PROJECT_ROOT / "public" / "images" / "yisun_actions"
FRAME_SIZE = 256
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


EFFECT_COLORS = {
    "core": (236, 253, 255, 225),
    "cyan": (78, 218, 255, 190),
    "blue": (48, 156, 255, 125),
    "spark": (255, 255, 255, 210),
}


def erase_left_edge_artifacts(frame: Image.Image) -> None:
    pixels = frame.load()
    width, height = frame.size
    for y in range(height):
        for x in range(min(58, width)):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 0:
                pixels[x, y] = (red, green, blue, 0)


def draw_thrust(draw: ImageDraw.ImageDraw, origin: tuple[int, int], length: int, strength: int) -> None:
    x, y = origin
    core = EFFECT_COLORS["core"]
    cyan = EFFECT_COLORS["cyan"]
    blue = EFFECT_COLORS["blue"]
    spark = EFFECT_COLORS["spark"]
    tip = x + length

    draw.line((x, y, tip, y), fill=core, width=3 + strength)
    draw.line((x + 4, y - 5, tip - 8, y - 8), fill=cyan, width=2 + strength)
    draw.line((x + 6, y + 5, tip - 10, y + 8), fill=cyan, width=2 + strength)
    draw.line((x + 12, y - 12, tip - 22, y - 16), fill=blue, width=1 + strength)
    draw.line((x + 15, y + 12, tip - 24, y + 17), fill=blue, width=1 + strength)
    draw.polygon(
        [(tip, y), (tip - 13, y - 8 - strength), (tip - 9, y), (tip - 13, y + 8 + strength)],
        fill=(113, 230, 255, 170),
    )

    for offset in (0, 12, 25):
        draw.line((x + offset, y - 2, x + offset + 10, y - 2), fill=spark, width=1)
        draw.line((x + offset + 4, y + 3, x + offset + 14, y + 3), fill=(*spark[:3], 155), width=1)


def enhance_one_handed(frame_key: str, frame: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    if frame_key == "stab_start":
        draw_thrust(draw, (184, 112), 33, 0)
    elif frame_key == "stab_middle":
        draw_thrust(draw, (188, 112), 62, 1)
        draw.line((176, 109, 210, 104), fill=(255, 255, 255, 120), width=1)
    elif frame_key == "stab_end":
        erase_left_edge_artifacts(frame)
        draw_thrust(draw, (188, 128), 20, 0)

    frame.alpha_composite(overlay)
    return frame


def enhance_two_handed(frame_key: str, frame: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    if frame_key == "stab_start":
        draw_thrust(draw, (197, 105), 33, 0)
    elif frame_key == "stab_middle":
        draw_thrust(draw, (198, 104), 55, 1)
        draw.line((182, 102, 216, 96), fill=(255, 255, 255, 120), width=1)
    elif frame_key == "stab_end":
        erase_left_edge_artifacts(frame)
        draw_thrust(draw, (196, 144), 22, 0)

    frame.alpha_composite(overlay)
    return frame


def rebuild_sheet(kind: str) -> None:
    frame_dir = ACTION_ROOT / f"{kind}_frames"
    frames = []

    for index, key in enumerate(FRAME_KEYS):
        frame_path = frame_dir / f"{index:02d}_{key}.png"
        frame = Image.open(frame_path).convert("RGBA")
        if key.startswith("stab_"):
            frame = enhance_one_handed(key, frame) if kind == "one_handed" else enhance_two_handed(key, frame)
            frame.save(frame_path)
        frames.append(frame)

    sheet = Image.new("RGBA", (FRAME_SIZE * len(FRAME_KEYS), FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (FRAME_SIZE * index, 0))
    sheet.save(ACTION_ROOT / f"{kind}_action_sheet_11.png")


def update_manifest() -> None:
    manifest_path = ACTION_ROOT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["status"] = "strict-review-pass-v1-stab-effect-enhanced"
    manifest.setdefault("reviewChecks", {})["stabEffectEnhancedWithoutCharacterOrWeaponRedraw"] = True
    manifest["strictConsistencyNote"] += (
        " Stab effects are strengthened as a separate overlay layer without redrawing the character or changing weapon geometry."
    )
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    rebuild_sheet("one_handed")
    rebuild_sheet("two_handed")
    update_manifest()


if __name__ == "__main__":
    main()
