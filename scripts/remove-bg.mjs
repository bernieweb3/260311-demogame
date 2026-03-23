import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const imgDir = path.join(root, 'img');

const jobs = [
    { input: path.join(imgDir, 'dungim1.jpg'), output: path.join(imgDir, 'dungim1.png') },
    { input: path.join(imgDir, 'dungim2.jpg'), output: path.join(imgDir, 'dungim2.png') },
];

const thresholdSq = 44 * 44;

function idx(x, y, w) {
    return (y * w + x) * 4;
}

function isNearBg(data, offset, bg) {
    const dr = data[offset] - bg.r;
    const dg = data[offset + 1] - bg.g;
    const db = data[offset + 2] - bg.b;
    return (dr * dr + dg * dg + db * db) <= thresholdSq;
}

function removeBackgroundRGBA(data, width, height) {
    const c1 = idx(0, 0, width);
    const c2 = idx(width - 1, 0, width);
    const c3 = idx(0, height - 1, width);
    const c4 = idx(width - 1, height - 1, width);

    const bg = {
        r: Math.round((data[c1] + data[c2] + data[c3] + data[c4]) / 4),
        g: Math.round((data[c1 + 1] + data[c2 + 1] + data[c3 + 1] + data[c4 + 1]) / 4),
        b: Math.round((data[c1 + 2] + data[c2 + 2] + data[c3 + 2] + data[c4 + 2]) / 4),
    };

    const visited = new Uint8Array(width * height);
    const stack = [];

    const tryPush = (x, y) => {
        const p = y * width + x;
        if (visited[p]) return;
        const off = p * 4;
        if (!isNearBg(data, off, bg)) return;
        visited[p] = 1;
        stack.push(p);
    };

    for (let x = 0; x < width; x++) {
        tryPush(x, 0);
        tryPush(x, height - 1);
    }
    for (let y = 1; y < height - 1; y++) {
        tryPush(0, y);
        tryPush(width - 1, y);
    }

    while (stack.length > 0) {
        const p = stack.pop();
        const x = p % width;
        const y = Math.floor(p / width);
        const off = p * 4;
        data[off + 3] = 0;

        if (x > 0) tryPush(x - 1, y);
        if (x < width - 1) tryPush(x + 1, y);
        if (y > 0) tryPush(x, y - 1);
        if (y < height - 1) tryPush(x, y + 1);
    }
}

async function processImage(input, output) {
    const src = sharp(input).ensureAlpha();
    const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
    removeBackgroundRGBA(data, info.width, info.height);
    await sharp(data, { raw: info }).png().toFile(output);
}

for (const job of jobs) {
    await fs.access(job.input);
    await processImage(job.input, job.output);
    console.log(`Created: ${path.relative(root, job.output)}`);
}
