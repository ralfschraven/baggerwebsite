# Netlify Blobs migration

The site now has a Netlify Functions adapter and uses the `bb-cms` Netlify Blob
store for CMS JSON and uploaded media. The old Vercel Blob store is intentionally
left untouched until the migration has been verified.

## Netlify environment variables

Set these in the Netlify site settings. Do not commit them or paste them into
chat:

- `ADMIN_USER`
- `ADMIN_PASSWORD`
- `ADMIN_SECRET`
- `NETLIFY_BLOBS_STORE` (optional, defaults to `bb-cms`)

Netlify automatically injects the Blobs context into Functions. For a local
copy or migration run, also set:

- `BLOB_READ_WRITE_TOKEN` (temporary read access to the existing Vercel store)
- `NETLIFY_SITE_ID`
- `NETLIFY_AUTH_TOKEN`

## Copy the existing content

Run a dry run first:

```bash
npm run migrate:blobs
```

When the object list looks correct, copy the objects:

```bash
npm run migrate:blobs -- --write
```

The script preserves the existing keys, including `cms/*.json` and
`uploads/*`, so the CMS records keep their references.

## Cutover order

1. Link the repository to the new Netlify site.
2. Configure the admin variables above.
3. Run the dry run and migration script.
4. Test public pages, login, CMS edits and image uploads on Netlify.
5. Keep the Vercel deployment available as a rollback for a short period.
6. Remove `@vercel/blob`, the temporary migration script and `vercel.json` only
   after the Netlify deployment is confirmed.
