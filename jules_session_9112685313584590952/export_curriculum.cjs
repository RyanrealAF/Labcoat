
const fs = require('fs');
const path = require('path');

// This script exports the curriculum data from src/data/curriculum.ts to JSON
// It's meant to be run with `npx tsx backend/scripts/export_curriculum.js`

const rootPath = path.resolve(__dirname, '../../');
const curriculumTsPath = path.join(rootPath, 'src/data/curriculum.ts');

if (!fs.existsSync(curriculumTsPath)) {
    console.error(`Error: ${curriculumTsPath} not found`);
    process.exit(1);
}

// Since we are running with tsx, we can just import it!
// But wait, tsx might have trouble importing from a different directory if not configured.
// Let's try to just read it and use a simpler approach if import fails.

try {
    // We use a dynamic import to load the TS file
    // Note: This requires tsx or similar
    const { FRACTAL_CURRICULUM } = require(curriculumTsPath);
    console.log(JSON.stringify(FRACTAL_CURRICULUM, null, 2));
} catch (e) {
    // Fallback: simple string extraction if require fails
    const curriculumTs = fs.readFileSync(curriculumTsPath, 'utf8');
    const startMarker = 'export const FRACTAL_CURRICULUM: FractalModule[] =';
    const startIndex = curriculumTs.indexOf(startMarker);
    if (startIndex === -1) {
        console.error('Could not find FRACTAL_CURRICULUM');
        process.exit(1);
    }
    // This fallback is very limited and might fail on complex TS
    console.error('Failed to import curriculum.ts directly. Fallback not implemented.');
    console.error(e);
    process.exit(1);
}
