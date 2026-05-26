import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/VNM/ADM2/geoBoundaries-VNM-ADM2_simplified.geojson";

const visitorAreas = [
  { id: "district-1", label: "District 1", shapeName: "Quan 1", center: [106.699, 10.775] },
  { id: "district-2", label: "District 2 / Thao Dien - An Phu", shapeName: "Quan 2", center: [106.755, 10.79] },
  { id: "district-3", label: "District 3", shapeName: "Quan 3", center: [106.682, 10.779] },
  { id: "district-4", label: "District 4", shapeName: "Quan 4", center: [106.704, 10.761] },
  { id: "district-5", label: "District 5", shapeName: "Quan 5", center: [106.669, 10.756] },
  { id: "district-6", label: "District 6", shapeName: "Quan 6", center: [106.638, 10.746] },
  { id: "district-7", label: "District 7", shapeName: "Quan 7", center: [106.729, 10.738] },
  { id: "district-9", label: "District 9", shapeName: "Quan 9", center: [106.82, 10.84] },
  { id: "district-10", label: "District 10", shapeName: "Quan 10", center: [106.669, 10.773] },
  { id: "district-11", label: "District 11", shapeName: "Quan 11", center: [106.648, 10.766] },
  { id: "binh-thanh", label: "Binh Thanh", shapeName: "Binh Thanh", center: [106.718, 10.812] },
  { id: "phu-nhuan", label: "Phu Nhuan", shapeName: "Phu Nhuan", center: [106.679, 10.801] },
  { id: "tan-binh", label: "Tan Binh", shapeName: "Tan Binh", center: [106.653, 10.803] },
  { id: "tan-phu", label: "Tan Phu", shapeName: "Tan Phu", center: [106.628, 10.792] },
  { id: "go-vap", label: "Go Vap", shapeName: "Go Vap", center: [106.667, 10.835] }
];

function visitCoordinates(coordinates, result = []) {
  if (typeof coordinates[0] === "number") {
    result.push(coordinates);
    return result;
  }
  coordinates.forEach((child) => visitCoordinates(child, result));
  return result;
}

function centerOf(feature) {
  const points = visitCoordinates(feature.geometry.coordinates);
  const total = points.reduce((sum, [lng, lat]) => [sum[0] + lng, sum[1] + lat], [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}

function distance(point, target) {
  return Math.hypot(point[0] - target[0], point[1] - target[1]);
}

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`Boundary source returned ${response.status}`);
const source = await response.json();

const features = visitorAreas.map((area) => {
  const candidates = source.features.filter((feature) => feature.properties.shapeName === area.shapeName);
  const selected = candidates.sort((left, right) => distance(centerOf(left), area.center) - distance(centerOf(right), area.center))[0];
  if (!selected) throw new Error(`Missing boundary for ${area.label}`);
  return {
    ...selected,
    properties: {
      id: area.id,
      label: area.label,
      sourceName: "geoBoundaries VNM ADM2 (2020), OCHA ROAP / Government of Viet Nam",
      sourceLicense: "CC BY 3.0 IGO"
    }
  };
});

await mkdir("public/data", { recursive: true });
await writeFile(
  "public/data/visitor-areas.json",
  `${JSON.stringify({ type: "FeatureCollection", features })}\n`
);

console.log(`Imported ${features.length} visitor-area polygons to public/data/visitor-areas.json`);
