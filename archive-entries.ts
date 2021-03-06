import * as contentful from 'contentful-management';
import 'dotenv/config';
import {readFile} from "fs/promises";

async function getEntriesToArchive(file: string) {
  const contents = await readFile(file, 'utf8');
  const parsed = JSON.parse(contents);
  return Array.isArray(parsed) ? parsed : [];
}

async function archiveEntries(entryIds: string[]) {
  if (!process.env.CONTENTFUL_SPACE_ID || !process.env.CONTENTFUL_MANAGEMENT_TOKEN) {
    throw ('Please set env vars');
  }
  const client = contentful.createClient(
    {
      accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
    },
  );
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment('make_space');

  for (const entryId of entryIds) {
    try {
      const entry = await environment.getEntry(entryId);
      if (entry.isPublished()) {
        await entry.unpublish();
      }
      await entry.archive();
      console.log(`Archived ${entryId}`);
    } catch (error) {
      console.error(`Failed to archive ${entryId}`, error);
    }
  }
}

getEntriesToArchive('./out/test.json')
  .then(archiveEntries)
  .catch(console.error);
