import axios from 'axios';
import dotenv from 'dotenv';
import 'reflect-metadata';
import { AppDataSource } from 'src/ormconfig';
import { Vinyl } from '../vinyls/vinyl.entity';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
if (!DISCOGS_TOKEN)
    throw new Error('Missing DISCOGS_TOKEN in environment variables.');

const BASE_URL = 'https://api.discogs.com';

async function seedDiscogsVinyls() {
    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(Vinyl);

        const searchResponse = await axios.get(`${BASE_URL}/database/search`, {
            params: {
                type: 'release',
                per_page: 50,
                token: DISCOGS_TOKEN,
            },
        });

        const results = searchResponse.data.results;

        for (const [index, item] of results.entries()) {
            const releaseId = item.id;
            const detailUrl = `${BASE_URL}/releases/${releaseId}?token=${DISCOGS_TOKEN}`;

            try {
                const detailRes = await axios.get(detailUrl);
                const details = detailRes.data;

                const title = details.title || 'Unknown Album';
                const authorName =
                    details.artists?.[0]?.name ||
                    details.label?.[0]?.name ||
                    'Unknown Artist';
                const description =
                    details.notes || 'No description available.';
                const imageUrl =
                    details.images?.[0]?.uri || item.cover_image || '';
                const priceCents = 1000; // Default price
                const discogsScore = details.community?.rating?.average || null;
                const discogsId = details.id;

                const existing = await repo.findOne({
                    where: [{ name: title }, { discogsId }],
                });
                if (existing) {
                    console.log(`Skipping existing vinyl: ${title}`);
                    continue;
                }

                const vinyl = repo.create({
                    name: title,
                    authorName,
                    description,
                    imageUrl,
                    priceCents,
                    discogsScore,
                    discogsId,
                });

                await repo.save(vinyl);
                console.log(
                    `[${index + 1}/${results.length}] Saved vinyl: ${title}`
                );
            } catch (detailErr) {
                console.error(
                    `Failed to fetch details for release ID ${releaseId}:`,
                    detailErr.message
                );
                continue;
            }

            // Add a short delay to avoid rate-limiting by Discogs
            await new Promise((res) => setTimeout(res, 500));
        }

        console.log('Successfully seeded all Discogs vinyls!');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await AppDataSource.destroy();
        console.log('Connection closed.');
    }
}

seedDiscogsVinyls();
