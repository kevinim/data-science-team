import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
const directory = JSON.parse(readFileSync(new URL('../docs/district-schools-2026.json', import.meta.url), 'utf8'));
const ratings = JSON.parse(readFileSync(new URL('../docs/ratings2026.json', import.meta.url), 'utf8'));
const zips = JSON.parse(readFileSync(new URL('../docs/zips.geojson', import.meta.url), 'utf8'));
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
check('historical boundary disclaimers', () => ['2019–20 과거 도형','2019/2023 과거 도형','GIS 미검증'].forEach(x => assert.ok(html.includes(x), x)));
check('compact map', () => assert.ok(html.includes('#map{height:420px;max-height:62vh}')));
check('new school directory is loaded', () => assert.ok(inline.includes('.then(loadDistrictCatalogs)')));
check('HTML IDs have no duplicates', () => {
 const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]);
 assert.equal(new Set(ids).size, ids.length);
});
console.log('Dashboard QA: ' + tests + ' checks passed.');
