import {createClient, Entry} from "contentful";
import 'dotenv/config'
import {mkdir, writeFile} from "fs/promises";

const contentType = '';

if (!process.env.CONTENTFUL_ACCESS_TOKEN || !process.env.CONTENTFUL_SPACE_ID) {
  throw new Error("Please specify env vars");
}

const client = createClient({
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN, space: process.env.CONTENTFUL_SPACE_ID
});

async function* getEntries(): AsyncGenerator<Entry<unknown>[]> {
  let total = 0;
  let progress = 0;
  do {
    const response = await client.getEntries({
      skip: progress,
      content_type: contentType,
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

const isEntryUnused = async (entry: Entry<unknown>) => {
  const entries = await client.getEntries({
    links_to_entry: entry.sys.id,
  });
  return entries.total === 0;
};

const listUnusedEntries = async () => {
  let unusedAssets: string[] = [];
  const iterator = getEntries();
  let result: IteratorResult<Entry<unknown>[]> = await iterator.next();
  while (!result.done) {
    const entries: Entry<unknown>[] = result.value;
    for (const entry of entries) {
      const isUnused = await isEntryUnused(entry);
      if (isUnused) {
        unusedAssets.push(`https://app.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/entries/${entry.sys.id}`);
      }
    }
    result = await iterator.next();
  }
  return unusedAssets;
};

listUnusedEntries()
  .then(async (unusedEntries) => {
    await mkdir('./out', { recursive: true });
    console.log(`Found ${unusedEntries.length} unreferenced entries. Bear in mind that these may be used via the API as a top-level object.`)
    return writeFile(`./out/unreferenced_entries_${contentType}_${unusedEntries.length}.json`, JSON.stringify(unusedEntries, null, 2));
  })
  .catch(console.error);
