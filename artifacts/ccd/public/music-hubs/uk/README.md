# UK Music Hub map data

`uk-hub-map.json` powers the zoomable UK map in Partner Hubs. It is generated; do not edit by hand.

## Sources

- **Boundaries:** Office for National Statistics, Open Geography Portal
  - Local Authority Districts (December 2024) Boundaries UK BUC
  - Regions (December 2024) Boundaries EN BUC
  - Countries (December 2024) Boundaries UK BUC
  - Licence: [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)
  - Attribution: Contains OS data © Crown copyright and database right 2024. Contains National Statistics data © Crown copyright and database right 2024.
- **Music Hub areas and lead organisations:** Arts Council England, *Music Hub Investment Programme – Hub Lead Organisations* (May 2024), linked from [Music Hub investment](https://www.artscouncil.org.uk/our-open-funds/music-hub-investment).
  - Two areas (London – South West, South Yorkshire) were "TBC" in that list; the map shows them without a lead organisation until a current source is checked.
  - East of England hub names and leads were cross-checked on each hub's official site.

## Rebuild

```bash
cd artifacts/ccd/scripts/geo-src
B=https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services
curl -sL -o lad.geojson  "$B/Local_Authority_Districts_December_2024_Boundaries_UK_BUC/FeatureServer/0/query?where=1%3D1&outFields=LAD24CD,LAD24NM&outSR=4326&f=geojson"
curl -sL -o rgn.geojson  "$B/Regions_December_2024_Boundaries_EN_BUC/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson"
curl -sL -o ctry.geojson "$B/Countries_December_2024_Boundaries_UK_BUC/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson"
curl -sL -o hlo.xlsx "https://www.artscouncil.org.uk/sites/default/files/2024-05/Music%20Hub%20Investment%20Programme%20-%20Hub%20Lead%20Organisations.xlsx"
cd ../.. && node scripts/build-uk-hub-map.mjs
```

The build stops if any English district is missing from, or appears in two, Music Hub areas.
