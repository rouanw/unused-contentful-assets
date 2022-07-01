import * as contentful from 'contentful-management';
import 'dotenv/config';
import {readFile} from "fs/promises";

async function getAssetsToArchive(file: string) {
  const contents = await readFile(file, 'utf8');
  const parsed = JSON.parse(contents);
  return Array.isArray(parsed) ? parsed : [];
}

async function archiveAssets(assetIds: string[]) {
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

  for (const assetId of assetIds) {
    try {
      const asset = await environment.getAsset(assetId);
      if (asset.isPublished()) {
        await asset.unpublish();
      }
      await asset.archive();
      console.log(`Archived ${assetId}`);
    } catch (error) {
      console.error(`Failed to archive ${assetId}`, error);
    }
  }
}

getAssetsToArchive('./archive/example.json')
  .then(archiveAssets)
  .catch(console.error);
