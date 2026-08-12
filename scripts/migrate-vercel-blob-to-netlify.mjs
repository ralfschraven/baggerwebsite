import { get, list } from "@vercel/blob";
import { getStore } from "@netlify/blobs";

const sourceToken = process.env.BLOB_READ_WRITE_TOKEN;
const siteID = process.env.NETLIFY_SITE_ID || process.env.NETLIFY_BLOBS_SITE_ID;
const destinationToken = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;
const storeName = process.env.NETLIFY_BLOBS_STORE || "bb-cms";
const shouldWrite = process.argv.includes("--write");

if (!sourceToken || !siteID || !destinationToken) {
  throw new Error(
    "Vereist: BLOB_READ_WRITE_TOKEN, NETLIFY_SITE_ID en NETLIFY_AUTH_TOKEN als environment variables.",
  );
}

async function listAllSourceBlobs() {
  const blobs = [];
  let cursor;

  do {
    const page = await list({ token: sourceToken, cursor });
    blobs.push(...(page.blobs || []));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return blobs;
}

async function toBuffer(stream) {
  if (!stream) {
    return Buffer.alloc(0);
  }

  if (typeof stream.arrayBuffer === "function") {
    return Buffer.from(await stream.arrayBuffer());
  }

  if (typeof stream.getReader === "function") {
    const reader = stream.getReader();
    const chunks = [];

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(Buffer.from(value));
    }

    return Buffer.concat(chunks);
  }

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

const sourceBlobs = await listAllSourceBlobs();
const destination = getStore({ name: storeName, siteID, token: destinationToken });

console.log(`Found ${sourceBlobs.length} Vercel Blob objects.`);

if (!shouldWrite) {
  console.log("Dry run only. Add --write to copy these objects to Netlify Blobs.");
  sourceBlobs.forEach((blob) => console.log(`- ${blob.pathname || blob.url}`));
  process.exit(0);
}

let copied = 0;

for (const source of sourceBlobs) {
  const key = source.pathname || new URL(source.url).pathname.replace(/^\/+/, "");
  const result = await get(key, { token: sourceToken, access: "private" });

  if (!result?.stream) {
    throw new Error(`Kon Vercel Blob niet lezen: ${key}`);
  }

  const buffer = await toBuffer(result.stream);
  await destination.set(key, buffer, {
    metadata: {
      contentType: result.contentType || "application/octet-stream",
      source: "vercel-blob-migration",
    },
  });

  copied += 1;
  console.log(`[${copied}/${sourceBlobs.length}] ${key} (${buffer.length} bytes)`);
}

console.log(`Copied ${copied} objects to Netlify Blob store \"${storeName}\".`);
