import {Asset, createClient} from "contentful";
import 'dotenv/config'
import { writeFile } from "fs/promises";

if (!process.env.CONTENTFUL_ACCESS_TOKEN || !process.env.CONTENTFUL_SPACE_ID) {
  throw new Error("Please specify env vars");
}

const client = createClient({
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN, space: process.env.CONTENTFUL_SPACE_ID
});

async function* getAssets(): AsyncGenerator<Asset[]> {
  let total = 0;
  let progress = 0;
  do {
    const response = await client.getAssets({
      skip: progress,
    });
    total = response.total;
    console.log({
      progress,
      total,
    });
    progress += response.items.length;
    yield response.items;
  } while (progress < total);
}

const isAssetUnused = async (asset: Asset) => {
  const entries = await client.getEntries({
    links_to_asset: asset.sys.id,
  });
  return entries.total === 0;
};

const listUnusedAssets = async () => {
  let unusedAssets: string[] = [];
  const iterator = getAssets();
  let result: IteratorResult<Asset[]> = await iterator.next();
  while (!result.done) {
    const assets: Asset[] = result.value;
    for (const asset of assets) {
      const isUnused = await isAssetUnused(asset);
      if (isUnused) {
        unusedAssets.push(asset.sys.id);
      }
    }
    result = await iterator.next();
  }
  return unusedAssets;
};

listUnusedAssets()
  .then(async (unusedAssets) => {
    console.log(`Found ${unusedAssets.length} unused assets`)
    return writeFile('./out/unreferenced_assets.json', JSON.stringify(unusedAssets));
  })
  .catch(console.error);
