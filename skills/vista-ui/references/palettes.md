# Palette library

53 curated colour palettes in five moods. Each one can become a full Vista theme in one command:

```
python3 scripts/palette_theme.py <id> --name my-theme --out my-theme.css   # then <html data-theme="my-theme">
```

Machine-readable copy: `palettes.json` (same folder). Visual browser: `examples/theme-gallery.html`
(rebuild its library section after editing the JSON: `python3 scripts/palette_theme.py --gallery`).

## How to choose

1. **Start from the product's mood**, not a favourite colour — the *Use for* column is the shortcut.
2. **Mode** decides the whole look:
   - `dark-chrome` — dark gradient backdrop + dark glass chrome + light glass panel (most dashboards).
   - `light` — light backdrop and chrome, white glass, black CTA (settings, minimal SaaS, calm consumer).
   - `dark` — dark panel too; the accent glows (dev tools, monitoring, gaming, night use).
   The suggested mode is in the table; override with `--mode`.
3. **If a built-in theme is close enough, use it** (*Closest* column) — it is hand-tuned. Generate only when
   the brand needs those exact colours.
4. **One accent.** The generator picks the most vivid colour as accent; force another with `--primary "#hex"`.
   Other palette colours become chart series, never extra UI colours.
5. **Check the report** at the top of the generated CSS (contrast of ink, muted text, accent, CTA; chart
   lightness gap) and screenshot a `--preview` page before shipping.

Role mapping used by the generator: darkest colour → backdrop & chrome tint · lightest → panel tint ·
most vivid → accent / nav / CTA (darkened to pass contrast) · most different (hue + lightness) → comparison
series `chart-2` · the rest → `chart-3…6` (normalised to mid lightness, near-duplicates dropped).

## Minimal & neutral

| # | Palette | Colours | Mode | Use for | Closest |
|---|---|---|---|---|---|
| 1 | Ink wash | `#252525` `#CFCFCF` `#7D7D7D` `#545454` | dark | monochrome dev tools, logs, admin consoles | `graphite` |
| 2 | Neutral elegance | `#FFDBBB` `#CCBEB1` `#997E67` `#664930` | dark-chrome | boutique retail, interiors, beauty | `terracotta` |
| 3 | Jade pebble morning | `#7B9669` `#E6E6E6` `#6C8480` `#BAC8B1` `#404E3B` | dark-chrome | wellness, agriculture, ESG reporting | `evergreen` |
| 4 | Woodland | `#9F7560` `#9E9E9E` `#AAD31E` `#D4AF9F` `#525034` | dark-chrome | outdoor, garden centre, field ops | `evergreen` |
| 5 | Driftwood pearl morning | `#BC7B6F` `#5A322A` `#E4A499` `#718A9E` `#CCCDC7` | dark-chrome | hospitality, spa bookings, lifestyle | `terracotta` |
| 6 | Graphite | `#C1C0C2` `#F5E9E7` `#837D68` `#8A9DB1` `#ECC5C6` | light | personal finance, journaling, calm consumer apps | `opaline` |
| 7 | Urban slate | `#E9E6E7` `#5E5653` `#7B7F8A` `#AB978C` `#6B7C98` | dark-chrome | real estate, architecture, B2B services | `marina` |
| 8 | Pearl | `#E9E3DE` `#A5937B` `#E3C49B` `#666161` `#AF9AC9` | light | fashion, events, wedding planning | `opaline` |
| 9 | Vichy | `#BBBFBF` `#878787` `#05AD98` `#FFFFFF` | light | clinics, health records, scheduling | `opaline` |
| 10 | Sorbet | `#CCCCCC` `#EDECEC` `#B7C396` `#FEFEFE` `#E0E7D7` `#BA9A91` | light | food delivery, recipes, grocery | `opaline` |
| 11 | Frozen mist | `#7C7D75` `#ADACA7` `#FCF8D8` `#D9DADF` `#DD700B` | light | IoT / energy monitoring, industrial | `opaline` |
| 12 | Yacht club | `#F2F0EF` `#BBBDBC` `#245F73` `#733E24` | dark-chrome | marine, travel, private banking | `marina` |

## Warm

| # | Palette | Colours | Mode | Use for | Closest |
|---|---|---|---|---|---|
| 13 | Amber walnut morning | `#EBEFEE` `#CCB499` `#C8906D` `#BB6C43` `#4A413C` | dark-chrome | coffee, bakery, craft e-commerce | `terracotta` |
| 14 | Copper aquamarine dream | `#DCAA89` `#30525C` `#C35627` `#D6794D` `#4C848D` `#BFB9B5` | dark-chrome | travel, hotels, tourism boards | `terracotta` |
| 15 | Cocoa topaz noonday | `#742F14` `#5A84AC` `#C7AC9F` `#FC9C44` `#5C3C2C` | dark-chrome | logistics, freight, warehouse | `terracotta` |
| 16 | Sandstone aquamarine serenity | `#BC6C50` `#304C53` `#DDAD9C` `#5A2F25` `#AFE0E7` | dark-chrome | property management, resorts | `terracotta` |
| 17 | Honey opal sunset | `#ECB914` `#F6D579` `#9D8108` `#CBB8A0` `#4F3D35` | dark-chrome | education, kids, beekeeping / farm | `terracotta` |
| 18 | Seashell garnet afternoon | `#F6C992` `#30525C` `#ACC0D3` `#D396A6` `#09A1A1` `#5484A4` | dark-chrome | community, non-profit, events | `marina` |
| 19 | Rose quartz evening | `#64242F` `#B44446` `#FC8F8F` `#DFD9D8` | dark-chrome | wine, restaurants, dating, beauty | `terracotta` |
| 20 | Calcite | `#DDDCDB` `#FD7B41` `#EDBF9B` `#3C4044` | dark-chrome | fitness, sports clubs, coaching | `opaline` |
| 21 | Fireside | `#E76814` `#D8D4BC` `#891A10` `#DC8236` `#B8210F` `#714236` | dark-chrome | restaurants, kitchens, food ops | `terracotta` |
| 22 | Terrazzo | `#EDBD95` `#374F4E` `#D1801E` `#DACCC4` `#AA8552` | dark-chrome | furniture, interiors, studios | `terracotta` |

## Cool

| # | Palette | Colours | Mode | Use for | Closest |
|---|---|---|---|---|---|
| 23 | Sapphire nightfall whisper | `#0474C4` `#5379AE` `#2C444C` `#A8C4EC` `#06457F` `#262B40` | dark-chrome | banking, insurance, enterprise SaaS | `indigo` |
| 24 | Lapis velvet evening | `#213885` `#ECDFD2` `#5F3475` `#081849` `#CCCACC` `#893172` | dark-chrome | luxury, wealth management, galleries | `lapis` |
| 25 | Marina | `#FFF1E7` `#B5D2E6` `#326080` `#805232` | dark-chrome | maritime, travel, logistics | `marina` |
| 26 | Emerald lavender lake | `#248C54` `#89618E` `#95DCE4` | dark-chrome | climate, wellbeing, biotech | `evergreen` |
| 27 | Sage peridot morning | `#345C32` `#9CAC54` `#A7F0DD` `#97CD97` | dark-chrome | agritech, sustainability, plant care | `evergreen` |
| 28 | Amethyst dawn haze | `#341C67` `#472F5B` `#C4AEF4` `#CCA4B4` `#DCCE40` | dark-chrome | creator tools, music, nightlife | `orchid` |
| 29 | Moon dust | `#D3D3FF` `#CEB5FF` `#8EC1DE` `#80A8FF` | light | productivity, notes, study apps | `orchid` |
| 30 | Turquoise amber autumn | `#304C64` `#26788E` `#A4CCD4` `#E2480C` `#631B08` | dark-chrome | operations centres, utilities, ops | `lagoon` |
| 31 | Sapphire ash morning | `#35627A` `#E5AEA9` `#B46258` `#A6A9D0` `#F5F5F5` `#8E9A98` | dark-chrome | healthcare, HR, people analytics | `marina` |
| 32 | Frosted aura | `#5C7E8F` `#A2A2A2` `#D4DDE2` `#FFFFFF` | light | internal tools, documentation, settings | `opaline` |
| 33 | Royal glimmer | `#AD7C4B` `#293C7C` `#C7984F` `#024944` `#812B4A` | dark-chrome | private banking, legal, heritage brands | `lapis` |
| 34 | Neptune | `#8FD9FB` `#4AB5B5` `#6D8BC0` `#525AFF` | dark-chrome | cloud, dev platforms, analytics | `lagoon` |

## Vivid & bold

| # | Palette | Colours | Mode | Use for | Closest |
|---|---|---|---|---|---|
| 35 | Tropical jade sunrise | `#FCA47C` `#23CED9` `#F9D779` `#A1CCA6` `#097C87` | dark-chrome | travel deals, summer campaigns, leisure | `lagoon` |
| 36 | Amethyst mint harmony | `#2A3F38` `#8DF688` `#562F54` `#57585D` `#F650BD` | dark | gaming, esports, streaming | `graphite` |
| 37 | Hibiscus aura | `#EA44D4` `#DD3027` `#733D6F` `#5848B3` | dark-chrome | fashion drops, music, social | `orchid` |
| 38 | Ocean ruby radiance | `#D8226C` `#B2DAE4` `#F86A38` `#029456` `#005BB3` | dark-chrome | marketing, campaigns, media | `indigo` |
| 39 | Tropical heat | `#00CEC8` `#FCEFC3` `#FF9C5F` `#EB4203` | dark-chrome | food delivery, quick commerce | `lagoon` |
| 40 | Celestial | `#2323FF` `#807D52` `#FFBD24` `#FFF224` | dark-chrome | fintech, crypto, trading | `indigo` |
| 41 | Festive eve | `#2323FF` `#24AEFF` `#C04AFF` `#7E3DFF` | dark-chrome | AI products, startups, launch dashboards | `orchid` |
| 42 | Freshly squeezed | `#FFBF00` `#F2CF7E` `#FFE642` `#FF7900` | light | kids, retail promos, juice / snack brands | `opaline` |
| 43 | Jelly shoes | `#E0AFFF` `#C4D6FF` `#DD68E3` `#8866DE` | dark-chrome | creator economy, social, Gen-Z consumer | `orchid` |

## Modern

| # | Palette | Colours | Mode | Use for | Closest |
|---|---|---|---|---|---|
| 44 | Opaline | `#F4F4F6` `#E7E7E7` `#D2D2D4` `#FF634A` | light | SaaS settings, billing, minimal product UIs | `opaline` |
| 45 | Gossamer | `#FAFAFA` `#939599` `#CDCDCF` `#2BCFCE` `#EC4D25` | light | design tools, portfolios, agencies | `opaline` |
| 46 | Clockwork | `#919599` `#F8F8F8` `#CDCDCB` `#FBA45C` `#E56515` | light | manufacturing, time tracking, field service | `opaline` |
| 47 | Lemon granite morning | `#F3E308` `#B8BFC1` `#6C8494` `#2C4C5C` | dark-chrome | construction, mobility, scooters | `marina` |
| 48 | Arctic reflection | `#5289AD` `#243C4C` `#ACBCBF` `#F4FCFB` `#698696` | dark-chrome | cloud infra, data warehouses, B2B | `marina` |
| 49 | Slate | `#BEBEBE` `#79ED91` `#4DBE55` `#71776D` `#698696` | dark | monitoring, uptime, devops | `graphite` |
| 50 | Autumn luxe | `#E2E1EB` `#AAAAAE` `#7F7265` `#BF8440` `#322D27` | dark-chrome | watches, premium retail, members clubs | `terracotta` |
| 51 | Inked | `#000000` `#DFDEDC` `#464545` `#00ACAC` `#A6A7A2` | dark | dev tools, terminals, security | `graphite` |
| 52 | Wraith | `#1E1702` `#E5E3E4` `#8C886B` `#047C58` `#342005` | dark | outdoor gear, hunting, military-style ops | `graphite` |
| 53 | Urban nocturne | `#141414` `#444444` `#D6D6D6` `#E2E800` `#979797` | dark | nightlife, streetwear, gaming, dark-mode tools | `graphite` |
