# Image Regeneration Brief

## Source Priority

Use Korean institutional or Korean-language authority sources first.

1. 국사편찬위원회 우리역사넷
2. 국가유산청 국가유산포털
3. 한국민족문화대백과
4. 국립민속박물관 한국민속대백과 / 한국문화상자
5. 국립중앙박물관 / e뮤지엄

General web image search or overseas references are secondary only. If a generated candidate looks Chinese wuxia, Japanese samurai/ninja, or generic fantasy instead of the intended Korean historical/folk context, reject it.

## Sprite Style Baseline

New character, enemy, bond, and event sprites should also fit the existing `knol-jump` character family, especially the Sejong, Yi Sun-sin, and Heo Nanseolheon sprites.

### Required Reference Assets

Use these local `knol-jump` sprites as the primary style references before generating or accepting any new person-like sprite:

- Sejong: `/Users/baekjiyun/Desktop/WAN/apps/pinky-ne-site/games/knol-jump/assets/characters/sejong/sejiong_front.png`
- Yi Sun-sin: `/Users/baekjiyun/Desktop/WAN/apps/pinky-ne-site/games/knol-jump/assets/characters/leesunsin/leesunsin_front.png`
- Heo Nanseolheon: `/Users/baekjiyun/Desktop/WAN/apps/pinky-ne-site/games/knol-jump/assets/characters/hernanseolheon/heonanseolheon_front.png`

The files are 256px RGBA sprites. They are style references only; do not copy their identities into unrelated NPCs, enemies, or bond encounters.

### Style Rules

- Use a 256px chibi educational-game feel, even if the saved candidate remains 512px for `weapon-reinforce` compatibility.
- Prefer a large head, short compact body, mostly front-facing or mild three-quarter stance, and calm readable pose.
- Use thick dark pixel outlines, simple flat color blocks, limited palette, and low-detail clothing folds.
- Avoid painterly RPG concept art, long heroic limbs, dense texture, dramatic action poses, and excessive shading.
- For mounted or large subjects, simplify the mount/object to the same compact toy-like sprite language rather than realistic illustration.

### Prompt Anchor

Include this style anchor, or a stricter variant of it, in future image prompts:

```text
Style reference: match the existing knol-jump Sejong, Yi Sun-sin, and Heo Nanseolheon front sprites. Use a 256px chibi Korean educational-game sprite feel, large head, short compact body, thick dark pixel outline, simple flat color blocks, limited palette, low-detail clothing folds, calm readable pose, and minimal antialiasing. Avoid painterly RPG concept art, long heroic limbs, dense texture, and dramatic action poses.
```

## Existing Enemy Images

### Replace First

#### `enemy_stage_4.png` - 홍길동과의 비무
- Current issue: reads too much like a Chinese wuxia trickster/Daoist with fan and ornate cap.
- Target: Korean popular image of Hong Gil-dong as a Joseon outlaw/义적 figure, Hwalbindang-like, agile but grounded.
- Visual cues: Joseon-era simple robe or short po, cloth belt, Korean hat or headwrap, travel shoes, simple staff or short sword. Avoid ornate Chinese scholar cap, Daoist fan, floating magic, Japanese ninja/samurai gear.
- Source basis:
  - 우리역사넷 허균/홍길동전 context
  - Korean popular recognition of Hong Gil-dong as a Joseon-era righteous outlaw.

Prompt draft:
```text
Use case: historical-scene
Asset type: 512px game enemy sprite
Primary request: Create a 16-bit Korean pixel-art enemy sprite of Hong Gil-dong as a Joseon-era righteous outlaw.
Subject: Agile Joseon outlaw, Hwalbindang-like folk hero, simple Korean robe/short po, cloth belt, Korean headwrap or modest gat-like hat, holding a simple wooden staff or short Korean blade.
Style/medium: cute but readable 16-bit pixel art matching the existing weapon-reinforce enemy sprites.
Composition/framing: full-body three-quarter view, centered, generous padding.
Scene/backdrop: perfectly flat pure white #FFFFFF background for chroma-key removal.
Constraints: Korean Joseon visual identity, grounded folk/outlaw look, no text, no shadow, no glow.
Avoid: Chinese wuxia robe, Daoist fan, ornate Chinese official hat, Japanese ninja/samurai armor, fantasy magic aura.
```

### Improve Next

#### `enemy_stage_6.png` - 북방 여진족 철기 격퇴
- Current issue: generally readable as northern cavalry, but could be more specifically northern frontier mounted scout instead of generic steppe warrior.
- Target: Jurchen/northern mounted raider as seen from Joseon frontier context.
- Visual cues: horse, fur/leather or scale-like armor, bow/quiver or spear, practical cold-region gear, compact cavalry silhouette. Avoid Joseon soldier uniform, Chinese imperial general, Qing dragon-banner grandeur, Mongol khan caricature.
- Source basis:
  - 우리역사넷 descriptions of Jurchen groups in Manchuria and Joseon northern frontier conflicts.

Prompt draft:
```text
Use case: historical-scene
Asset type: 512px game enemy sprite
Primary request: Create a 16-bit pixel-art enemy sprite of a Jurchen northern cavalry scout encountered on the Joseon frontier.
Subject: Mounted northern frontier raider on a small sturdy horse, fur/leather winter clothing, simple scale or leather armor pieces, quiver and short spear, rugged Manchurian/Jurchen frontier feel.
Style/medium: cute but readable 16-bit pixel art matching the existing weapon-reinforce enemy sprites.
Composition/framing: full-body horse-and-rider three-quarter view, centered, readable at small size.
Scene/backdrop: perfectly flat pure white #FFFFFF background for chroma-key removal.
Constraints: clearly not Joseon; grounded northern cavalry; no text, no shadow, no glow.
Avoid: Chinese imperial general, Qing court robe, Mongol khan caricature, Japanese samurai armor, Korean Joseon military uniform.
```

#### `enemy_stage_1.png` - 뒷골목 깡패 소탕
- Current issue: works as a ruffian but leans generic fantasy bandit.
- Target: Korean village/back-alley ruffian.
- Visual cues: worn hanbok-style jeogori and baji, cloth belt, rough wooden club, straw shoes, messy topknot/headwrap.

Prompt draft:
```text
Use case: historical-scene
Asset type: 512px game enemy sprite
Primary request: Create a 16-bit Korean pixel-art sprite of a Joseon village back-alley ruffian.
Subject: Poor local troublemaker in worn Korean jeogori and baji, cloth belt, straw shoes, messy hair or headwrap, holding a rough wooden club.
Style/medium: cute but readable 16-bit pixel art matching the existing weapon-reinforce enemy sprites.
Composition/framing: full-body three-quarter view, centered, generous padding.
Scene/backdrop: perfectly flat pure white #FFFFFF background for chroma-key removal.
Constraints: Korean local commoner silhouette, no text, no shadow, no glow.
Avoid: Chinese martial artist, Japanese bandit/ninja, fantasy armor, modern clothing.
```

### Keep For Now

- `enemy_stage_2.png` - 멧돼지: acceptable.
- `enemy_stage_3.png` - 호랑이: acceptable, Korean folk tiger tone works.
- `enemy_stage_5.png` - 왜구: acceptable for now because it reads as ragged coastal raider, not heroic samurai. Regenerate later only if stricter reference matching is needed.
- `enemy_stage_7.png` - 백색 이무기: acceptable, but avoid turning future versions into ornate Chinese dragon.

## New Image Backlog

These currently use emoji fallback and need real pixel assets.

### Bond Encounters

#### `bond_neighborhood_resident.png`
- Subject: Joseon village commoner offering rice ball or small pouch.
- Source basis: Korean commoner hanbok; National Folk Museum male hanbok/common clothing references.
- Avoid: Chinese queue hairstyle, Japanese kimono, fantasy monk.

#### `bond_village_teacher.png`
- Subject: Seodang village teacher / 훈장님 with scroll or book.
- Source basis: 서당/훈장 descriptions from 한국민족문화대백과 and 우리역사넷; gat, dopo/durumagi-like scholarly clothing.
- Avoid: Chinese official robe, Confucian court mandarin hat, Japanese monk.

#### `bond_traveling_doctor.png`
- Subject: Korean traveling herbal doctor with medicine pouch.
- Source basis: Korean folk medicine/herbal peddler imagery; simple hanbok travel clothing.
- Avoid: Chinese Daoist alchemist, Japanese medicine seller costume.

### Event / Hazard Assets

#### `event_treasure_chest.png`
- Korean-looking old wooden chest, not fantasy treasure box.

#### `event_merchant_escort.png`
- Joseon-era merchant group or pack carrier, simple bundles, Korean clothing.

#### `event_forge_shrine.png`
- Small Korean mountain shrine/stone altar/fire ember, not Chinese temple or Japanese torii.

#### `event_abandoned_supplies.png`
- Abandoned Joseon frontier supplies: sacks, rope, old jar, simple spear bundle.

#### `hazard_bandit_tax.png`
- Suspicious toll collectors on a Korean mountain road, ragged clothing, no samurai/ninja.

#### `hazard_muddy_ravine.png`
- Muddy ravine/collapsed Korean mountain path, no character required.

## Immediate Work Order

1. Regenerate `enemy_stage_4.png` candidate as `enemy_stage_4_candidate_honggildong_v2.png`.
2. Regenerate `enemy_stage_6.png` candidate as `enemy_stage_6_candidate_jurchen_v2.png`.
3. Regenerate `enemy_stage_1.png` candidate as `enemy_stage_1_candidate_ruffian_v2.png`.
4. Generate bond assets for 동네 주민, 훈장님, 떠돌이 의원.
5. Generate event/hazard assets.
6. Review all candidates against Korean-source grounding before replacing existing runtime assets.

## Generated Candidates

Generated on 2026-06-04. These files are review candidates only and do not replace runtime assets yet.

### Existing Enemy Replacements

- `public/images/candidates/enemy_stage_4_candidate_honggildong_v2.png`
  - Status: promising replacement candidate.
  - Notes: Removes the old fan/Daoist/wuxia silhouette. Reads as a Joseon outlaw with headwrap, worn clothing, staff, and short blade.
- `public/images/candidates/enemy_stage_6_candidate_jurchen_v2.png`
  - Status: promising replacement candidate.
  - Notes: Reads more clearly as an external northern mounted scout with horse, quiver, spear, fur/leather layers, and armor pieces.
- `public/images/candidates/enemy_stage_1_candidate_ruffian_v2.png`
  - Status: usable but needs one stricter variant before final replacement.
  - Notes: Clothing and pose read as a Joseon local ruffian, but the metal-studded club is slightly too fantasy-like. A later variant should use a plainer wooden club.

### Bond Encounter Candidates

- `public/images/candidates/bond_neighborhood_resident_candidate_v1.png`
  - Status: promising runtime candidate once bond images are wired into the app.
  - Notes: Simple commoner clothing, gift pouch, and friendly face fit the 동네 주민 encounter.
- `public/images/candidates/bond_village_teacher_candidate_v1.png`
  - Status: promising runtime candidate once bond images are wired into the app.
  - Notes: Gat, book/scroll, and pointer communicate 훈장님 without turning into a Chinese official.
- `public/images/candidates/bond_traveling_doctor_candidate_v1.png`
  - Status: promising runtime candidate once bond images are wired into the app.
  - Notes: Medicine pouch, herbs, travel bundle, and plain clothing avoid Daoist alchemist or fantasy healer drift.

### Review Montage

- `public/images/candidates/candidate_montage_v1.png`
  - Use this for quick visual review of the first six candidates.

## Knol-Jump Style-Matched Candidates

Generated after comparing against the existing Sejong, Yi Sun-sin, and Heo Nanseolheon front sprites.

- `public/images/candidates/knol_style_compare_v1.png`
  - Shows the style mismatch between the original 1차 candidates and the `knol-jump` reference sprites.
- `public/images/candidates/knol_style_candidates_montage_v1.png`
  - Shows the `knol-jump` reference sprites together with the style-matched candidates below.
- `public/images/candidates/enemy_stage_4_candidate_honggildong_knol_style_v1.png`
  - Status: better style match than the earlier Hong Gil-dong candidate.
  - Notes: More compact body and calmer stance; still should be checked against the exact runtime display scale.
- `public/images/candidates/enemy_stage_1_candidate_ruffian_knol_style_v1.png`
  - Status: better style match than the earlier ruffian candidate.
  - Notes: Uses a plain wooden club and simpler silhouette.
- `public/images/candidates/enemy_stage_6_candidate_jurchen_knol_style_v1.png`
  - Status: improved, but still inherently more complex because the subject includes a horse.
  - Notes: If this still feels too detailed in the app, make a non-mounted scout variant or a more toy-like horse variant.
- `public/images/candidates/bond_neighborhood_resident_knol_style_v1.png`
  - Status: strong style match candidate.
- `public/images/candidates/bond_village_teacher_knol_style_v1.png`
  - Status: strong style match candidate.
- `public/images/candidates/bond_traveling_doctor_knol_style_v1.png`
  - Status: strong style match candidate.
