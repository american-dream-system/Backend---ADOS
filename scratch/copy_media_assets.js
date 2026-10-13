const fs = require('fs');
const path = require('path');

const eventsSourceDir = 'd:/Work/Amrican dream/A-D/Client/public/events photos/In door & rooftop';
const funParkSourceDir = 'd:/Work/Amrican dream/A-D/Client/public/FunZone images/AD park';

const serverMediaEventsDir = 'd:/Work/Amrican dream/A-D/Server/upload/media/events';
const serverMediaFunParkDir = 'd:/Work/Amrican dream/A-D/Server/upload/media/fun-park';

const clientMediaEventsDir = 'd:/Work/Amrican dream/A-D/Client/public/media/events';
const clientMediaFunParkDir = 'd:/Work/Amrican dream/A-D/Client/public/media/fun-park';

[serverMediaEventsDir, serverMediaFunParkDir, clientMediaEventsDir, clientMediaFunParkDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function copyValidImages(srcDir, destDirs, prefix) {
    const files = fs.readdirSync(srcDir);
    const copied = [];
    let idx = 1;

    for (const f of files) {
        const ext = path.extname(f).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

        const srcPath = path.join(srcDir, f);
        // Create clean slug filename
        const cleanExt = ext === '.jpeg' ? '.jpg' : ext;
        const slugName = `${prefix}-${String(idx).padStart(2, '0')}${cleanExt}`;
        idx++;

        for (const destDir of destDirs) {
            fs.copyFileSync(srcPath, path.join(destDir, slugName));
            // Also copy original sanitized filename
            const sanitizedOriginal = f.replace(/[^\w\d\-_.]/g, '_');
            fs.copyFileSync(srcPath, path.join(destDir, sanitizedOriginal));
        }

        copied.push({
            original: f,
            slug: slugName,
            url: `/media/${prefix}/${slugName}`,
            serverUrl: `http://localhost:9500/media/${prefix}/${slugName}`
        });
    }

    return copied;
}

const copiedEvents = copyValidImages(eventsSourceDir, [serverMediaEventsDir, clientMediaEventsDir], 'events');
const copiedFunPark = copyValidImages(funParkSourceDir, [serverMediaFunParkDir, clientMediaFunParkDir], 'fun-park');

console.log(`Copied ${copiedEvents.length} events images.`);
console.log(`Copied ${copiedFunPark.length} fun-park images.`);

// Write manifest
fs.writeFileSync('d:/Work/Amrican dream/A-D/Server/scratch/manifest_events.json', JSON.stringify(copiedEvents, null, 2));
fs.writeFileSync('d:/Work/Amrican dream/A-D/Server/scratch/manifest_funpark.json', JSON.stringify(copiedFunPark, null, 2));
console.log('Manifests written successfully.');
