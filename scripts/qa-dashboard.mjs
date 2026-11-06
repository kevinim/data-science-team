import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
const directory = JSON.parse(readFileSync(new URL('../docs/district-schools-2026.json', import.meta.url), 'utf8'));
const ratings = JSON.parse(readFileSync(new URL('../docs/ratings2026.json', import.meta.url), 'utf8'));
const zips = JSON.parse(readFileSync(new URL('../docs/zips.geojson', import.meta.url), 'utf8'));
const plano = JSON.parse(readFileSync(new URL('../docs/plano-attendance-2025.geojson', import.meta.url), 'utf8'));
const legacySchools = JSON.parse(readFileSync(new URL('../docs/schools.json', import.meta.url), 'utf8'));

let tests = 0;
const check = (name, action) => { action(); tests++; console.log('PASS ' + name); };
const inline = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map(m => m[1]).filter(Boolean).join('\n');

check('inline JavaScript is valid', () => new Script(inline, {filename: 'docs/index.html'}));
check('all 6 districts are selectable', () => ['FISD','PISD','AISD','PROSPER','LISD','CFB'].forEach(d => assert.ok(html.includes('<option value="' + d + '">'), d)));
check('district filtering is actually wired', () => assert.ok(inline.includes("el('districtFilter').onchange=")));
check('2026-27 catalog year', () => assert.equal(directory.schoolYear, '2026–27'));
check('84 campuses, 53 LISD and 31 CFB', () => {
 assert.equal(directory.schools.length, 84);
 assert.equal(directory.schools.filter(s => s.district === 'LISD').length, 53);
 assert.equal(directory.schools.filter(s => s.district === 'CFB').length, 31);
});
check('no duplicated district campus names', () => {
 const names = directory.schools.map(s => s.district + '/' + s.name.toLowerCase());
 assert.equal(new Set(names).size, names.length);
});
check('no invented coordinates', () => assert.ok(directory.schools.every(s => !s.ll && !s.address)));
check('all 2026 CFB ratings valid', () => {
 assert.equal(directory.ratings.length, 31);
 assert.ok(directory.ratings.every(r => r.year === 2026 && Number.isInteger(r.score) && r.score >= 0 && r.score <= 100));
 assert.ok(directory.ratings.every(r => r.rating === (r.score >= 90 ? 'A' : r.score >= 80 ? 'B' : r.score >= 70 ? 'C' : r.score >= 60 ? 'D' : 'F')));
});
check('CFB scores reference official evidence', () => assert.ok(directory.ratings.every(r => r.official === directory.sources.CFBratings)));
check('all 11 ZIP geometries available', () => {
 assert.equal(zips.type, 'FeatureCollection');
 const zipSet = new Set(zips.features.map(f => String(f.properties?.ZCTA5CE20)));
 for (const zip of ['75093','75024','75025','75035','75034','75036','75033','75013','75078','75056','75010']) assert.ok(zipSet.has(zip),zip);
});
check('existing A-only ratings are valid', () => assert.ok(ratings.data.every(r => r.year === 2026 && r.rating === 'A' && r.score >= 90)));
check('historical boundary disclaimers', () => ['2025–26 공식 GIS 참고 도형','2019/2023 과거 도형','GIS 미검증'].forEach(x => assert.ok(html.includes(x), x)));
check('Plano official 2025-26 source clearly marked historical', () => {
 assert.equal(plano.type,'FeatureCollection');
 assert.equal(plano.metadata.sourceYear,'2025–26');
 assert.equal(plano.metadata.validForCurrent2026_27,false);
 assert.ok(inline.includes("./plano-attendance-2025.geojson"));
 assert.ok(!inline.includes("./plano-attendance-2019.geojson"));
 assert.ok(plano.features.every(f => f.properties.current === false && f.properties.sourceVintage === '2025–26' && f.properties.sourceDistrict === 'PISD'));
});
check('64 complete Plano attendance polygons by level', () => {
 assert.equal(plano.features.length,64);
 for (const [level,count] of Object.entries({elementary:44,middle:11,high:6,senior:3})) assert.equal(plano.features.filter(f => f.properties.gradeLevel===level).length,count);
 assert.ok(plano.features.every(f => ['Polygon','MultiPolygon'].includes(f.geometry.type)));
});
check('Plano polygon coordinates valid WGS84 in study area', () => {
 let vertices=0;
 function walk(c){if(typeof c[0]==='number'){const [lng,lat]=c;assert.ok(lng>-97.5&&lng< -96.3&&lat>32.6&&lat<33.5);vertices++;return;}c.forEach(walk);}
 plano.features.forEach(f=>walk(f.geometry.coordinates));
 assert.ok(vertices>30000);
});
check('official Plano polygon names match campus directory', () => {
 const key=s=>String(s||'').toLowerCase().replace(/\b(dr|doctor|elementary|middle|senior|sr|high|school|campus)\b/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 const campuses=legacySchools.schools.filter(s=>s.district==='PISD');
 const matches=campuses.filter(s=>plano.features.some(f=>(s.type==='high'?['senior','high']:s.type==='middle'?['middle']:['elementary']).includes(f.properties.gradeLevel)&&key(f.properties.school)===key(s.name)));
 assert.equal(matches.length,61);
});
check('compact map', () => assert.ok(html.includes('#map{height:420px;max-height:62vh}')));
check('new school directory is loaded', () => assert.ok(inline.includes('.then(loadDistrictCatalogs)')));
check('HTML IDs have no duplicates', () => {
 const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]);
 assert.equal(new Set(ids).size, ids.length);
});
console.log('Dashboard QA: ' + tests + ' checks passed.');
