# North Dallas Explorer — attendance boundaries and campus data audit

Reviewed: **2026-11-05**, school year **2026–27**.

## Verified map layer coverage

| District | 2026–27 authoritative lookup | Map polygons currently shown | Release status |
| --- | --- | --- | --- |
| Frisco ISD (FISD) | [2026–27 zone search](https://www.friscoisd.org/page/2026-2027-zones/) | Current official 2026–27 search polygons fetched from `static.friscoisd.org`; conditional on successful browser fetch | CURRENT BY SOURCE, address lookup is authoritative |
| Plano ISD (PISD) | [Official SchoolFinder](https://www.pisd.edu/district-resources/schools-facilities/schools-other-facilities/schoolfinder) | `plano-attendance-2025.geojson` (64 features, 2025–26 official PISD ArcGIS: 44 elementary, 11 middle, 6 high, 3 senior high) | 2025–26 OFFICIAL SOURCE; 2026–27 EQUIVALENCE UNVERIFIED |
| Allen ISD (AISD) | [Find a School](https://www.allenisd.org/page/findaschool) | `allen-attendance-historical.geojson` (20 features, 2019 high / 2023 elementary-middle) | HISTORICAL ONLY |
| Prosper ISD | [Official attendance boundaries](https://www.prosper-isd.net/page/attendance-boundaries/) | None. 2026–27 approved map PDFs exist, but polygon conversion/georeferencing has not been validated | LINK ONLY |
| Lewisville ISD (LISD) | [2026–27 School Locator](https://www.lisd.net/resources/families/school-locator) | None. Locator is current; no audited vector export is supplied in this application | LINK ONLY |
| Carrollton–Farmers Branch ISD (CFB) | [School Search](https://www.cfbisd.edu/students/school-maps-locator-system) reflecting **March 6, 2025** approved zones for 2026–27 registrations | None. Geometry not audited or imported | LINK ONLY |

**Important:** the existence of a current address locator does not mean its underlying geometry was obtained, georeferenced, and audited for this dashboard.

### Plano ArcGIS verification — 2026-11-05

The official [2026–27 SchoolFinder](https://www.pisd.edu/district-resources/schools-facilities/schools-other-facilities/schoolfinder) links to ArcGIS Experience item `73a3f873d9c040348d6e723ed4b48af4` (owner `blueraster.pisd`), which uses Plano ISD web map item `68c373c99db1425e9f0030a689efa742`. Its four *public official* boundary layers at `https://services4.arcgis.com/uBV8NRVfoRJv7qWn/arcgis/rest/services/Plano_ISD_School_Districts/FeatureServer/` are named **Senior High 2526**, **High 2526**, **Middle 2526**, **Elementary 2526** (IDs 0–3). Their ArcGIS editingInfo data timestamps are from March–April 2025. These are **not** marked as verified 2026–27 geometries despite the parent web page's 2026–27 heading.

The new `plano-attendance-2025.geojson` contains 64 complete polygons queried directly from those layer endpoints with WGS84 longitude-latitude coordinates. Coverage: 3 senior high, 6 high, 11 middle, 44 elementary. All features set `current:false`, `sourceVintage:"2025–26"`, `sourceDistrict:"PISD"`; map overlays use orange historical styling. 61 of 63 Plano schools in `schools.json` match these official polygons by grade and normalized name. `ROSE HAGGAR ELEMENTARY SCHOOL` and `ACADEMY HIGH SCHOOL` are unmatched and receive no inferred polygons.

The historical `plano-attendance-2019.geojson` is retained for provenance/rollback but no longer displayed. No claim is made that the 2025–26 geometries are unchanged for 2026–27; compare actual address-level results with the current locator before decisions. A ZIP/ZCTA layer is **not** an attendance-boundary layer. School locations are **not** attendance boundaries. No historical polygons are represented as current.

## School catalog coverage

- `schools.json`: 73 City of Plano GIS school records (PISD and FISD), positions last updated 2022.
- `schools2026-{1..4}.json`: 26 geocoded school records (FISD / AISD / Prosper).
- `ratings2026.json`: 108 externally compiled, source-linked 2026 **A-rated** campus results across four districts (coverage is intentionally incomplete).
- `district-schools-2026.json`: **53 Lewisville ISD** and **31 CFB ISD** schools from their official school lists, reviewed 2026-11-05. Those campus names are included in search and filters, but **no guessed geocoding coordinates** are distributed.
- The same new file contains **31 CFB campus ratings for 2026**, copied from [CFB ISD's official 2026 campus-level ratings table](https://www.cfbisd.edu/departments/assessment-accountability/ratings). All grades A–F are shown where verified; an unrated campus is labeled unverified rather than failing.

Sources:
- LISD [official A–Z school list](https://www.lisd.net/our-district/about/a-z-school-list)
- CFB [official schools](https://www.cfbisd.edu/schools)
- CFB [official performance reporting](https://www.cfbisd.edu/departments/assessment-accountability/ratings)
- TEA [2026 rating release](https://tea.texas.gov/about-tea/newsroom/tea-releases-2026-f-accountability-ratings-txschoolsgov)

## Outstanding validation tasks

1. Obtain verifiably 2026–27 school-level ArcGIS features or approved export from Plano/Allen/Prosper/LISD/CFB. For PDF-only zones, geo-reference and independently compare against the district address locator at parcel-level samples before importing.
2. Verify ZIP school assignments for several boundary-adjacent addresses. No school assignment is inferred just from ZIP, neighborhood names, or school proximity.
3. Geocode LISD and CFB schools against independently checked campus addresses. Display markers only after verification.
4. Monitor the **2027–28 Prosper proposed rezoning** separately; do not display proposals as current year boundaries. As of November 5, 2026, board presentation for Nov 16 was still pending.
5. Refresh district school lists and TEA scores periodically, showing the checked date and provenance.

## Release checks

- JavaScript parser validation of `docs/index.html`.
- JSON schema, names, score ranges/grade mapping, duplicate campus checks and six-district dropdown coverage.
- Live GitHub Pages browser regression for base map, ZIP selection, school search, district filter, official links and map-layer freshness warnings.
- Automated status labels must never state that an unverified layer is current.
