#!/usr/bin/env python3
"""Build simplified world and Europe map geometry from Natural Earth 110m.

Natural Earth is public domain. https://www.naturalearthdata.com/about/terms-of-use/
Historical cuts (Weimar Germany, interwar Poland, Czechoslovakia, the Urals,
Manchuria, north and south China) are hand-authored for this classroom game.
They are not traced from a copyleft basemap.

Usage:
  python3 scripts/build-map-geometry.py /path/to/ne_110m_admin_0_countries.geojson /path/to/ne_110m_lakes.geojson
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from shapely.geometry import GeometryCollection, MultiPolygon, Point, Polygon, box, mapping, shape
from shapely.ops import unary_union
from shapely.validation import make_valid

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "game" / "mapShapes.ts"

# Afro-Eurasia fills the right of the world chart. Degrees chosen so Europe,
# Africa, the Middle East, the USSR, China, and the Pacific read in one sea.
EUR_LON0 = -20.0
EUR_LAT0 = 78.0
EUR_PX = 4.82
EUR_PY = 6.22
EUR_OX = 270.0
EUR_OY = 22.0

# Americas sit in the Atlantic margin at a slightly smaller scale so South
# America keeps its shape without crowding Europe.
AME_LON0 = -128.0
AME_LAT0 = 78.0
AME_PX = 3.15
AME_PY = 4.15
AME_OX = 18.0
AME_OY = 78.0

WORLD_W = 1240
WORLD_H = 960

# Hitler's Spread: Europe, the western Soviet Union, and the North African shore.
SPR_LON0 = -14.0
SPR_LAT0 = 72.0
SPR_PX = 11.6
SPR_PY = 16.4
SPR_OX = 28.0
SPR_OY = 18.0
SPR_W = 1000
SPR_H = 900

# Interwar Poland, 1921–1939, simplified from border cities (Danzig corridor,
# East Prussia left to Germany, Vilnius and Lwów inside, Minsk outside).
POLAND_1930 = Polygon(
    [
        (18.15, 54.85),
        (19.35, 54.40),
        (19.55, 54.05),
        (21.15, 53.95),
        (22.70, 54.30),
        (23.50, 54.28),
        (24.70, 54.42),
        (25.05, 54.48),
        (25.40, 54.78),
        (25.55, 54.95),
        (26.35, 55.05),
        (26.85, 54.55),
        (27.05, 54.10),
        (27.35, 53.25),
        (27.55, 52.20),
        (26.70, 51.15),
        (26.45, 50.20),
        (26.15, 48.55),
        (24.40, 49.05),
        (22.40, 49.15),
        (19.40, 49.35),
        (18.55, 49.85),
        (18.15, 50.45),
        (17.15, 51.25),
        (16.35, 52.15),
        (16.45, 53.15),
        (17.70, 54.15),
        (18.15, 54.85),
    ]
)

# Northeast China, drawn so Manchuria is not a rectangle.
MANCHURIA_ZONE = Polygon(
    [
        (118.8, 41.6),
        (120.2, 44.2),
        (119.6, 47.0),
        (121.5, 53.4),
        (126.5, 53.6),
        (131.5, 51.5),
        (135.2, 48.2),
        (134.6, 44.6),
        (131.2, 42.6),
        (128.2, 41.2),
        (125.2, 40.2),
        (122.4, 40.6),
        (118.8, 41.6),
    ]
)

# South of a bend that follows the Qinling and the lower Yangtze, not a ruled line.
SOUTH_ZONE = Polygon(
    [
        (97.5, 28.2),
        (100.5, 31.6),
        (103.5, 30.2),
        (106.8, 32.4),
        (109.5, 31.2),
        (112.2, 32.6),
        (115.0, 30.4),
        (117.8, 32.2),
        (122.4, 31.6),
        (122.8, 21.5),
        (109.5, 17.8),
        (97.2, 21.5),
        (97.5, 28.2),
    ]
)

# Western Soviet Union is west of a simplified Ural line, not a meridian.
WEST_URAL = Polygon(
    [
        (-30.0, 82.0),
        (78.0, 82.0),
        (72.0, 76.0),
        (67.0, 69.0),
        (62.0, 62.0),
        (59.0, 56.0),
        (56.0, 50.0),
        (54.0, 44.0),
        (58.0, 36.0),
        (-30.0, 36.0),
        (-30.0, 82.0),
    ]
)

EAST_PRUSSIA = Polygon(
    [
        (19.32, 54.42),
        (19.55, 54.78),
        (20.55, 54.92),
        (21.70, 54.48),
        (22.95, 54.48),
        (22.85, 54.12),
        (21.55, 53.82),
        (20.05, 53.62),
        (19.38, 54.02),
        (19.32, 54.42),
    ]
)

# Carpathian Ruthenia, the eastern tail of Czechoslovakia, now in Ukraine.
RUTHENIA = Polygon(
    [
        (22.05, 48.05),
        (22.00, 48.62),
        (22.70, 49.10),
        (24.55, 48.95),
        (24.60, 47.95),
        (22.05, 48.05),
    ]
)

EXPLICIT = {
    "Canada": "canada",
    "United States of America": "usa",
    "Mexico": "latin",
    "Greenland": "decor:Greenland",
    "United Kingdom": "britain",
    "Ireland": "decor:Ireland",
    "France": "france",
    "Spain": "spain",
    "Portugal": "decor:Portugal",
    "Belgium": "low",
    "Netherlands": "low",
    "Luxembourg": "low",
    "Germany": "germany",
    "Poland": "poland",
    "Austria": "austria",
    "Czechia": "czech",
    "Slovakia": "czech",
    "Switzerland": "decor:Switzerland",
    "Italy": "italy",
    "Albania": "italy",
    "Denmark": "denmark",
    "Norway": "norway",
    "Sweden": "sweden",
    "Finland": "decor:Finland",
    "Estonia": "wsoviet",
    "Latvia": "wsoviet",
    "Lithuania": "wsoviet",
    "Hungary": "decor:Hungary",
    "Romania": "decor:Romania",
    "Bulgaria": "decor:Bulgaria",
    "Greece": "greece",
    "Bosnia and Herz.": "balkans",
    "Croatia": "balkans",
    "Slovenia": "balkans",
    "Serbia": "balkans",
    "Montenegro": "balkans",
    "North Macedonia": "balkans",
    "Kosovo": "balkans",
    "Turkey": "turkey",
    "Cyprus": "mideast",
    "N. Cyprus": "mideast",
    "Syria": "mideast",
    "Lebanon": "mideast",
    "Israel": "mideast",
    "Palestine": "mideast",
    "Jordan": "mideast",
    "Iraq": "mideast",
    "Saudi Arabia": "mideast",
    "Yemen": "mideast",
    "Oman": "mideast",
    "United Arab Emirates": "mideast",
    "Qatar": "mideast",
    "Kuwait": "mideast",
    "Iran": "mideast",
    "Egypt": "egypt",
    "Morocco": "nafrica",
    "Algeria": "nafrica",
    "Tunisia": "nafrica",
    "Libya": "nafrica",
    "W. Sahara": "nafrica",
    "Ethiopia": "ethiopia",
    "Eritrea": "ethiopia",
    "Somalia": "ethiopia",
    "Somaliland": "ethiopia",
    "Djibouti": "ethiopia",
    "Russia": "ussr",
    "Ukraine": "ussr",
    "Belarus": "ussr",
    "Moldova": "ussr",
    "Georgia": "ussr",
    "Armenia": "ussr",
    "Azerbaijan": "ussr",
    "Kazakhstan": "ussr",
    "Uzbekistan": "ussr",
    "Turkmenistan": "ussr",
    "Kyrgyzstan": "ussr",
    "Tajikistan": "ussr",
    "Mongolia": "decor:Mongolia",
    "China": "china",
    "Taiwan": "japan",
    "North Korea": "korea",
    "South Korea": "korea",
    "Japan": "japan",
    "Myanmar": "seasia",
    "Thailand": "seasia",
    "Laos": "seasia",
    "Vietnam": "seasia",
    "Cambodia": "seasia",
    "Malaysia": "seasia",
    "Indonesia": "seasia",
    "Brunei": "seasia",
    "Timor-Leste": "seasia",
    "Philippines": "philippines",
    "Papua New Guinea": "pacific",
    "Solomon Is.": "pacific",
    "Fiji": "pacific",
    "New Caledonia": "pacific",
    "Vanuatu": "pacific",
    "Australia": "australia",
    "New Zealand": "australia",
    "India": "decor:India",
    "Pakistan": "decor:India",
    "Bangladesh": "decor:India",
    "Nepal": "decor:India",
    "Bhutan": "decor:India",
    "Sri Lanka": "decor:India",
    "Afghanistan": "decor:Afghanistan",
    "Iceland": "decor:Iceland",
}

AFRICA_WEST = {
    "Senegal",
    "Gambia",
    "Guinea-Bissau",
    "Guinea",
    "Sierra Leone",
    "Liberia",
    "Côte d'Ivoire",
    "Ghana",
    "Togo",
    "Benin",
    "Nigeria",
    "Niger",
    "Mali",
    "Burkina Faso",
    "Mauritania",
    "Cameroon",
    "Gabon",
    "Congo",
    "Dem. Rep. Congo",
    "Eq. Guinea",
    "Central African Rep.",
    "Chad",
}
AFRICA_SOUTH = {
    "Sudan",
    "S. Sudan",
    "Kenya",
    "Uganda",
    "Tanzania",
    "Rwanda",
    "Burundi",
    "Angola",
    "Zambia",
    "Zimbabwe",
    "Mozambique",
    "Namibia",
    "Botswana",
    "South Africa",
    "Madagascar",
    "Malawi",
    "Lesotho",
    "eSwatini",
}

# Hand-placed Pacific islands that 110m data omits. Radius is in degrees.
PACIFIC_DOTS = [
    (145.2, 15.2, 0.55),
    (145.7, 13.5, 0.42),
    (144.7, 13.4, 0.35),
    (147.0, 8.0, 0.45),
    (152.0, 7.2, 0.4),
    (158.2, 6.9, 0.45),
    (163.0, 6.3, 0.35),
    (168.3, 7.5, 0.4),
    (171.2, 7.1, 0.45),
    (167.5, 9.0, 0.3),
    (172.0, 1.4, 0.35),
    (174.0, 1.8, 0.28),
    (157.0, -8.0, 0.55),
    (160.1, -9.4, 0.5),
]


def clean(geom):
    if geom is None or geom.is_empty:
        return None
    geom = make_valid(geom)
    if isinstance(geom, GeometryCollection):
        polys = [g for g in geom.geoms if isinstance(g, (Polygon, MultiPolygon))]
        geom = unary_union(polys) if polys else None
    if geom is None or geom.is_empty:
        return None
    return geom


def parts(geom):
    geom = clean(geom)
    if geom is None:
        return []
    if isinstance(geom, Polygon):
        return [geom]
    if isinstance(geom, MultiPolygon):
        return list(geom.geoms)
    return []


def centroid_ok(poly: Polygon) -> Point:
    point = poly.representative_point()
    return point


def project_eurasia(lon: float, lat: float) -> tuple[float, float]:
    return (EUR_OX + (lon - EUR_LON0) * EUR_PX, EUR_OY + (EUR_LAT0 - lat) * EUR_PY)


def project_americas(lon: float, lat: float) -> tuple[float, float]:
    return (AME_OX + (lon - AME_LON0) * AME_PX, AME_OY + (AME_LAT0 - lat) * AME_PY)


def project_spread(lon: float, lat: float) -> tuple[float, float]:
    return (SPR_OX + (lon - SPR_LON0) * SPR_PX, SPR_OY + (SPR_LAT0 - lat) * SPR_PY)


def ring_area(coords: list[float]) -> float:
    area = 0.0
    n = len(coords) // 2
    for i in range(n):
        x1, y1 = coords[2 * i], coords[2 * i + 1]
        x2, y2 = coords[2 * ((i + 1) % n)], coords[2 * ((i + 1) % n) + 1]
        area += x1 * y2 - x2 * y1
    return area / 2


def project_geom(geom, projector, min_px: float = 0.8) -> list[list[float]]:
    geom = clean(geom)
    if geom is None:
        return []
    # Simplify in degrees before projecting so the bundle stays small.
    geom = geom.simplify(0.18, preserve_topology=True)
    rings: list[list[float]] = []
    for poly in parts(geom):
        if poly.area < 0.02 and poly.bounds[2] - poly.bounds[0] < 0.4:
            # Keep modest islands; drop specks.
            if poly.area < 0.008:
                continue
        projected = Polygon(
            [projector(x, y) for x, y in poly.exterior.coords],
            [[projector(x, y) for x, y in hole.coords] for hole in poly.interiors],
        )
        if not projected.is_valid:
            projected = clean(projected)
        if projected is None:
            continue
        projected = projected.simplify(0.9, preserve_topology=True)
        # Fatten specks so Pacific and Aegean islands survive on a projector.
        if projected.area < 28:
            projected = projected.buffer(1.6).simplify(0.6)
        for piece in parts(projected):
            if piece.area < min_px:
                continue
            exterior = flatten(piece.exterior.coords)
            if ring_area(exterior) == 0 or len(exterior) < 6:
                continue
            rings.append(exterior)
            for hole in piece.interiors:
                hole_ring = flatten(hole.coords)
                if len(hole_ring) >= 6 and abs(ring_area(hole_ring)) > 4:
                    rings.append(hole_ring)
    return rings


def flatten(coords) -> list[float]:
    out: list[float] = []
    last = None
    for x, y in coords:
        pair = (round(float(x), 1), round(float(y), 1))
        if pair == last:
            continue
        last = pair
        out.extend(pair)
    if len(out) >= 4 and out[0] == out[-2] and out[1] == out[-1]:
        out = out[:-2]
    return out


def bounds_of(rings: list[list[float]]) -> tuple[float, float, float, float] | None:
    xs: list[float] = []
    ys: list[float] = []
    for ring in rings:
        xs.extend(ring[0::2])
        ys.extend(ring[1::2])
    if not xs:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def anchor_of(geom, projector) -> list[float]:
    point = geom.representative_point()
    x, y = projector(point.x, point.y)
    return [round(x, 1), round(y, 1)]


def dot_poly(lon: float, lat: float, radius: float) -> Polygon:
    steps = 8
    coords = []
    for i in range(steps):
        a = (math.tau * i) / steps
        coords.append((lon + math.cos(a) * radius, lat + math.sin(a) * radius * 0.75))
    coords.append(coords[0])
    return Polygon(coords)


def load_countries(path: Path) -> dict[str, object]:
    data = json.loads(path.read_text())
    grouped: dict[str, list] = {}
    skipped: list[str] = []
    for feature in data["features"]:
        name = feature["properties"]["NAME"]
        continent = feature["properties"].get("CONTINENT")
        if continent == "Antarctica" or name in {"Antarctica", "Fr. S. Antarctic Lands"}:
            continue
        geom = clean(shape(feature["geometry"]))
        if geom is None:
            continue
        target = EXPLICIT.get(name)
        if target is None and name in AFRICA_WEST:
            target = "wafrica"
        elif target is None and name in AFRICA_SOUTH:
            target = "safrica"
        elif target is None and continent in {"North America", "South America"}:
            target = "latin"
        elif target is None:
            skipped.append(name)
            continue
        for poly in parts(geom):
            if poly.area < 0.01:
                continue
            point = centroid_ok(poly)
            assigned = retarget(name, target, point, poly)
            if assigned is None:
                continue
            grouped.setdefault(assigned, []).append(poly)
    print("unassigned:", ", ".join(sorted(set(skipped))))
    return {key: unary_union(value) for key, value in grouped.items()}


def retarget(name: str, target: str, point: Point, poly: Polygon) -> str | None:
    lon, lat = point.x, point.y
    # Far-east Russia is stored across the antimeridian.
    if name == "Russia" and lon < -160:
        return "ussr"
    # European metropoles should not drag Guyana, Réunion, or the Caribbean into Europe.
    if target in {"france", "low", "britain", "spain", "portugal", "decor:Portugal", "dennor", "italy"}:
        if lon < -30 or (lat < 20 and lon > 40) or lon > 60:
            if lon < -30 and lat < 30:
                return "latin"
            return None
        if target == "spain" and lat < 27 and lon < -10:
            return "spain"
    if target == "usa" and lon > 0:
        return None
    if name == "New Zealand" and target == "australia":
        return "australia"
    return target


def build_political(grouped: dict[str, object]) -> dict[str, object]:
    germany = grouped["germany"]
    poland_modern = grouped["poland"]
    ussr = grouped["ussr"]
    czech = grouped["czech"]
    ukraine = ussr.intersection(box(22, 44, 40, 53))
    belarus = ussr.intersection(box(23, 51, 33, 57))
    lithuania = ussr.intersection(box(20.5, 53.5, 26.8, 56.6))
    german_east = poland_modern.difference(POLAND_1930)
    poland = POLAND_1930.intersection(unary_union([poland_modern, ukraine, belarus, lithuania]))
    poland = clean(poland)
    russia_parts = []
    other_ussr = []
    for poly in parts(ussr):
        point = centroid_ok(poly)
        if 18.5 < point.x < 23.2 and 53.6 < point.y < 55.4:
            russia_parts.append(poly)
        else:
            other_ussr.append(poly)
    kaliningrad = unary_union(russia_parts) if russia_parts else Polygon()
    germany = unary_union(
        [
            germany,
            german_east,
            EAST_PRUSSIA.intersection(unary_union([germany, poland_modern, kaliningrad, ussr])),
            kaliningrad,
        ]
    )
    germany = clean(germany.difference(poland))
    ruthenia = RUTHENIA.intersection(ussr)
    czech = clean(unary_union([czech, ruthenia]).difference(poland).difference(germany))
    # Keep the Baltic states and the rest of the Soviet west, minus land given to Poland.
    ussr_rest = clean(unary_union(other_ussr).difference(poland).difference(czech))
    wsoviet = clean(ussr_rest.intersection(WEST_URAL))
    siberia = clean(ussr_rest.difference(wsoviet))
    china = grouped["china"]
    manchuria = clean(china.intersection(MANCHURIA_ZONE))
    south = clean(china.intersection(SOUTH_ZONE).difference(manchuria))
    north = clean(china.difference(manchuria).difference(south))
    political = {key: value for key, value in grouped.items() if key not in {"germany", "poland", "czech", "ussr", "china"}}
    political.update(
        {
            "germany": germany,
            "poland": poland,
            "czech": czech,
            "wsoviet": wsoviet,
            "siberia": siberia,
            "manchuria": manchuria,
            "nchina": north,
            "schina": south,
        }
    )
    pacific = political.get("pacific")
    dots = unary_union([dot_poly(lon, lat, radius) for lon, lat, radius in PACIFIC_DOTS])
    political["pacific"] = clean(unary_union([pacific, dots]) if pacific is not None else dots)
    if "denmark" in political and "norway" in political:
        political["dennor"] = clean(unary_union([political["denmark"], political["norway"]]))
    return {key: clean(drop_slivers(value)) for key, value in political.items()}


def drop_slivers(geom):
    kept = [poly for poly in parts(geom) if poly.area >= 0.045 or (poly.bounds[2] - poly.bounds[0]) > 1.2]
    if not kept:
        return geom
    return unary_union(kept)


def make_exclusive(geoms: dict[str, object]) -> dict[str, object]:
    ordered = sorted((key for key, value in geoms.items() if value is not None and not value.is_empty), key=lambda key: geoms[key].area)
    used = None
    out: dict[str, object] = {}
    for key in ordered:
        geom = geoms[key]
        if used is not None:
            geom = clean(geom.difference(used))
        out[key] = geom
        used = geom if used is None else unary_union([used, geom])
    return out


def world_projector_for(key: str, geom) -> object:
    point = geom.representative_point()
    if key in {"canada", "usa", "latin", "decor:Greenland"}:
        return project_americas
    if point.x < -25 and key == "latin":
        return project_americas
    return project_eurasia


def emit_shapes(political: dict[str, object], projector_for, width: int, height: int, keys: list[str]) -> list[dict]:
    shapes = []
    for key in keys:
        geom = political.get(key)
        if geom is None or geom.is_empty:
            print("MISSING", key)
            continue
        projector = projector_for(key, geom)
        # Territories that straddle plates (none expected) use one projector.
        rings = project_geom(geom, projector)
        # Drop rings that fall far outside the frame (Alaska-sized misses, dateline junk).
        kept = []
        for ring in rings:
            boxb = bounds_of([ring])
            if boxb is None:
                continue
            minx, miny, maxx, maxy = boxb
            if maxx < -20 or maxy < -20 or minx > width + 20 or miny > height + 20:
                continue
            if maxx - minx < 1.5 and maxy - miny < 1.5:
                continue
            kept.append(ring)
        if not kept:
            print("EMPTY after project", key)
            continue
        anchor_geom = geom
        # Prefer an anchor inside the largest polygon so labels hit the mainland.
        largest = max(parts(geom), key=lambda poly: poly.area)
        anchor = anchor_of(largest, projector)
        shapes.append({"id": key, "rings": kept, "anchor": anchor})
    return shapes


def main() -> None:
    countries_path = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/ne/countries.geojson")
    lakes_path = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/ne/lakes.geojson")
    grouped = load_countries(countries_path)
    political = build_political(grouped)

    world_keys = [
        "canada",
        "usa",
        "latin",
        "britain",
        "dennor",
        "sweden",
        "france",
        "low",
        "germany",
        "poland",
        "austria",
        "czech",
        "spain",
        "italy",
        "balkans",
        "greece",
        "wsoviet",
        "siberia",
        "turkey",
        "mideast",
        "nafrica",
        "egypt",
        "wafrica",
        "ethiopia",
        "safrica",
        "manchuria",
        "nchina",
        "schina",
        "korea",
        "japan",
        "seasia",
        "philippines",
        "pacific",
        "australia",
    ]
    # greece is merged into the world Balkans tile. The spread map keeps it separate.
    world_political = dict(political)
    world_political["balkans"] = clean(unary_union([political["balkans"], political["greece"]]))
    decor_keys = sorted(key for key in political if key.startswith("decor:"))
    world_keep = [key for key in world_keys if key != "greece"] + decor_keys
    world_political = {**world_political, **make_exclusive({key: world_political[key] for key in world_keep if key in world_political})}
    world_shapes = emit_shapes(world_political, world_projector_for, WORLD_W, WORLD_H, [key for key in world_keys if key != "greece"])
    world_decor = emit_shapes(world_political, world_projector_for, WORLD_W, WORLD_H, decor_keys)

    def spread_projector(_key, _geom):
        return project_spread

    spread_clip = box(-13.5, 20.5, 70.0, 72.2)
    spread_political = {}
    for key, geom in political.items():
        if geom is None or geom.is_empty:
            continue
        clipped = clean(geom.intersection(spread_clip))
        if clipped is not None and not clipped.is_empty and clipped.area > 0.04:
            spread_political[key] = clipped
    spread_decor_keys = [
        "decor:Ireland",
        "decor:Portugal",
        "decor:Switzerland",
        "decor:Hungary",
        "decor:Romania",
        "decor:Bulgaria",
        "decor:Finland",
    ]
    spread_ids = [
        "britain",
        "norway",
        "sweden",
        "denmark",
        "france",
        "low",
        "germany",
        "poland",
        "austria",
        "czech",
        "italy",
        "spain",
        "balkans",
        "greece",
        "wsoviet",
        "nafrica",
    ]
    spread_political = {**spread_political, **make_exclusive({key: spread_political[key] for key in spread_ids + spread_decor_keys if key in spread_political})}
    spread_shapes = emit_shapes(
        spread_political,
        spread_projector,
        SPR_W,
        SPR_H,
        [
            "britain",
            "norway",
            "sweden",
            "denmark",
            "france",
            "low",
            "germany",
            "poland",
            "austria",
            "czech",
            "italy",
            "spain",
            "balkans",
            "greece",
            "wsoviet",
            "nafrica",
        ],
    )
    for item in spread_shapes:
        if item["id"] == "wsoviet":
            item["id"] = "ussr"
    spread_decor = emit_shapes(spread_political, spread_projector, SPR_W, SPR_H, spread_decor_keys)

    lakes = json.loads(lakes_path.read_text())
    lake_geoms = []
    for feature in lakes["features"]:
        geom = clean(shape(feature["geometry"]))
        if geom is not None and geom.area > 0.3:
            lake_geoms.append(geom)
    lake_union = unary_union(lake_geoms) if lake_geoms else Polygon()
    world_lakes = project_geom(lake_union, project_eurasia, min_px=6) + project_geom(lake_union, project_americas, min_px=6)
    spread_lakes = project_geom(lake_union, project_spread, min_px=8)

    payload = {
        "world": {"w": WORLD_W, "h": WORLD_H, "shapes": world_shapes, "decor": world_decor, "lakes": world_lakes},
        "spread": {"w": SPR_W, "h": SPR_H, "shapes": spread_shapes, "decor": spread_decor, "lakes": spread_lakes},
    }
    write_ts(payload)
    write_preview(payload)
    print("world", [(item["id"], sum(abs(ring_area(ring)) for ring in item["rings"]) // 1) for item in world_shapes])
    print("spread", [item["id"] for item in spread_shapes])


def write_ts(payload: dict) -> None:
    def body(shapes: list[dict]) -> str:
        chunks = []
        for shape in shapes:
            rings = ",".join("[" + ",".join(str(n) for n in ring) + "]" for ring in shape["rings"])
            anchor = ",".join(str(n) for n in shape["anchor"])
            chunks.append(f'{{id:"{shape["id"]}",anchor:[{anchor}],rings:[{rings}]}}')
        return ",\n".join(chunks)

    def lakes(rings: list[list[float]]) -> str:
        return ",".join("[" + ",".join(str(n) for n in ring) + "]" for ring in rings)

    text = f"""// Generated by scripts/build-map-geometry.py. Do not edit by hand.
// Coastlines and country outlines: Natural Earth 1:110m, public domain.
// https://www.naturalearthdata.com/about/terms-of-use/
// Weimar Germany, interwar Poland, Czechoslovakia, the Urals split, Manchuria,
// and the north/south China split are simplified borders drawn for this game.

export interface MapShape {{
  id: string;
  anchor: [number, number];
  rings: number[][];
}}

export interface MapBoard {{
  w: number;
  h: number;
  shapes: MapShape[];
  decor: MapShape[];
  lakes: number[][];
}}

export const WORLD_BOARD: MapBoard = {{
  w: {payload["world"]["w"]},
  h: {payload["world"]["h"]},
  shapes: [
{body(payload["world"]["shapes"])}
  ],
  decor: [
{body(payload["world"]["decor"])}
  ],
  lakes: [
{lakes(payload["world"]["lakes"])}
  ],
}};

export const SPREAD_BOARD: MapBoard = {{
  w: {payload["spread"]["w"]},
  h: {payload["spread"]["h"]},
  shapes: [
{body(payload["spread"]["shapes"])}
  ],
  decor: [
{body(payload["spread"]["decor"])}
  ],
  lakes: [
{lakes(payload["spread"]["lakes"])}
  ],
}};
"""
    OUT.write_text(text)
    print("wrote", OUT, "bytes", OUT.stat().st_size)


def write_preview(payload: dict) -> None:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("PIL missing, skip preview")
        return
    palette = [
        (70, 110, 150),
        (150, 90, 70),
        (90, 130, 90),
        (160, 140, 70),
        (120, 80, 110),
        (80, 140, 140),
        (170, 120, 80),
        (100, 100, 140),
        (140, 100, 90),
        (90, 120, 80),
    ]
    for name in ("world", "spread"):
        board = payload[name]
        image = Image.new("RGB", (board["w"], board["h"]), (18, 42, 58))
        draw = ImageDraw.Draw(image)
        for index, shape in enumerate(board["shapes"]):
            color = palette[index % len(palette)]
            for ring in shape["rings"]:
                draw.polygon(list(zip(ring[0::2], ring[1::2])), fill=color)
            x, y = shape["anchor"]
            draw.text((x, y), shape["id"], fill=(255, 248, 230))
        for shape in board["decor"]:
            for ring in shape["rings"]:
                draw.polygon(list(zip(ring[0::2], ring[1::2])), fill=(196, 176, 130))
            x, y = shape["anchor"]
            label = shape["id"].replace("decor:", "")
            draw.text((x, y), label, fill=(40, 28, 16))
        for ring in board["lakes"]:
            draw.polygon(list(zip(ring[0::2], ring[1::2])), fill=(14, 48, 70))
        path = Path(f"/tmp/{name}-map.png")
        image.save(path)
        print("preview", path)


if __name__ == "__main__":
    main()
