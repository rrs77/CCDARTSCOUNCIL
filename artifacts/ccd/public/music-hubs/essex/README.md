# Essex district map assets

Interactive EMS Music Hub map boundaries (12 district / borough LAs).

## Source

- **Dataset:** Local Authority Districts (December 2024) Boundaries UK **BGC** (generalised, coastline-clipped), simplified for SVG
- **Fallback in repo:** `essex-districts-source.geojson` = **BUC** (ultra generalised) if BGC is not present locally
- **Publisher:** Office for National Statistics (Open Geography Portal)
- **Filter:** LAD24CD `E07000066`–`E07000077` (excludes Southend-on-Sea & Thurrock unitaries)
- **Licence:** [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)
- Attribution: Contains OS data © Crown copyright and database right. Contains National Statistics data © Crown copyright and database right.

## Rebuild

```bash
# Optional: refresh generalised boundaries from ONS ArcGIS FeatureServer
WHERE="LAD24CD IN ('E07000066','E07000067','E07000068','E07000069','E07000070','E07000071','E07000072','E07000073','E07000074','E07000075','E07000076','E07000077')"
ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$WHERE")
curl -sL -o artifacts/ccd/public/music-hubs/essex/essex-districts-source-bgc.geojson \
  "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Local_Authority_Districts_December_2024_Boundaries_UK_BGC/FeatureServer/0/query?where=${ENC}&outFields=LAD24CD,LAD24NM&outSR=4326&f=geojson"

node artifacts/ccd/scripts/build-essex-districts-svg.mjs
```

Outputs:

- `essex-districts.svg` — combined interactive map
- `<slug>.svg` — per-district thumbnails
- `../../src/components/musicHubs/essexDistrictPaths.ts` — path + label data for `EssexDistrictMap`

`essex-districts-source-bgc.geojson` is gitignored (large); commit SVG/TS outputs and the BUC fallback GeoJSON.
