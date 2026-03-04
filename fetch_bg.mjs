import fs from 'fs';

async function build() {
    const ids = new Set();
    const searchTerms = [
        'beautiful scenic vertical nature landscape',
        'calm forest misty vertical',
        'ocean waves vertical sunrise',
        'mountains mist vertical tall'
    ];

    for (const term of searchTerms) {
        // Fetch 5 pages of 30 results for each term (150 results per term = 600 potential images)
        for (let page = 1; page <= 5; page++) {
            if (ids.size >= 120) break; // Cap at around 120 images to keep the bundle size reasonable
            try {
                const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(term)}&per_page=30&page=${page}`);
                const d = await res.json();
                d.results.forEach(r => {
                    if (r.width < r.height && ids.size < 120 && r.urls?.raw) {
                        // Ensure vertical/portrait images, exclude premium watermarked images, and save the raw image URL
                        if (!r.urls.raw.includes('plus.unsplash.com')) {
                            ids.add(r.urls.raw.split('?')[0]);
                        }
                    }
                });
            } catch (e) {
                console.error(`Failed on term: ${term}, page: ${page}`, e);
            }
        }
    }

    const arr = Array.from(ids);
    let content = `export const BACKGROUNDS: string[] = [\n`;
    content += arr.map(url => `  '${url}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80'`).join(',\n');
    content += `\n];\n`;

    fs.writeFileSync('src/data/backgrounds.ts', content);
    console.log('Successfully wrote ' + arr.length + ' true Unsplash backgrounds!');
}

build();
