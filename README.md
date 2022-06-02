# Find potentially unused content in Contentful

## Usage

Create `.env` in the root, with a shape like:

```
CONTENTFUL_SPACE_ID=abc123
CONTENTFUL_ACCESS_TOKEN=zzz
```

Then run:
```sh
# entries
npm run build && node dist/entries.js

# assets
npm run build && node dist/entries.js
```

For entries, you can edit `entries.ts` and set the `contentType` to report on a specific content type.
