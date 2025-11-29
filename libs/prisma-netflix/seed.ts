import { PrismaClient } from '@prisma/client-netflix';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

async function main() {
    const prisma = new PrismaClient();
    // Adjust path to point to the root netflix_shows.sql
    const sqlFilePath = path.join(__dirname, 'netflix_shows.sql');

    console.log(`Reading SQL file from: ${sqlFilePath}`);

    if (!fs.existsSync(sqlFilePath)) {
        console.error(`File not found: ${sqlFilePath}`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(sqlFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let isCopyBlock = false;
    const shows = [];

    for await (const line of rl) {
        if (line.startsWith('COPY public.netflix_shows')) {
            isCopyBlock = true;
            continue;
        }

        if (isCopyBlock) {
            if (line === '\\.') {
                isCopyBlock = false;
                break;
            }

            const parts = line.split('\t');
            if (parts.length >= 12) {
                const [
                    show_id,
                    type,
                    title,
                    director,
                    cast_members,
                    country,
                    date_added_str,
                    release_year,
                    rating,
                    duration,
                    listed_in,
                    description,
                ] = parts;

                const date_added = date_added_str !== '\\N' ? new Date(date_added_str) : null;

                shows.push({
                    show_id,
                    type: type !== '\\N' ? type : null,
                    title: title !== '\\N' ? title : null,
                    director: director !== '\\N' ? director : null,
                    cast_members: cast_members !== '\\N' ? cast_members : null,
                    country: country !== '\\N' ? country : null,
                    date_added,
                    release_year: release_year !== '\\N' ? parseInt(release_year, 10) : null,
                    rating: rating !== '\\N' ? rating : null,
                    duration: duration !== '\\N' ? duration : null,
                    listed_in: listed_in !== '\\N' ? listed_in : null,
                    description: description !== '\\N' ? description : null,
                });
            }
        }
    }

    console.log(`Parsed ${shows.length} shows. Inserting into database...`);

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < shows.length; i += batchSize) {
        const batch = shows.slice(i, i + batchSize);
        await prisma.netflixShow.createMany({
            data: batch,
            skipDuplicates: true,
        });
        console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(shows.length / batchSize)}`);
    }

    console.log('Seeding completed successfully.');
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
