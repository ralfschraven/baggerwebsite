const { getStore } = require("@netlify/blobs");

const storeName = process.env.NETLIFY_BLOBS_STORE || "bb-cms";

function getConfiguredStore() {
  try {
    const siteID = process.env.NETLIFY_SITE_ID || process.env.NETLIFY_BLOBS_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;

    if (siteID && token) {
      return getStore({
        name: storeName,
        siteID,
        token,
        apiURL: process.env.NETLIFY_BLOBS_API_URL,
        edgeURL: process.env.NETLIFY_BLOBS_EDGE_URL,
      });
    }

    if (!process.env.NETLIFY_BLOBS_CONTEXT && !globalThis.netlifyBlobsContext) {
      return null;
    }

    // In a deployed Netlify Function the Blobs context is injected automatically.
    return getStore(storeName);
  } catch {
    return null;
  }
}

async function readJson(key) {
  const store = getConfiguredStore();

  if (!store) {
    return null;
  }

  return store.get(key, { type: "json" });
}

async function writeJson(key, value) {
  const store = getConfiguredStore();

  if (!store) {
    throw new Error(
      "Opslaan op Netlify vereist een Netlify Function-context of NETLIFY_SITE_ID en NETLIFY_AUTH_TOKEN.",
    );
  }

  await store.setJSON(key, value);
}

async function readBinary(key) {
  const store = getConfiguredStore();

  if (!store) {
    return null;
  }

  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });

  if (!result) {
    return null;
  }

  return {
    buffer: Buffer.from(result.data),
    metadata: result.metadata || {},
  };
}

async function writeBinary(key, buffer, metadata = {}) {
  const store = getConfiguredStore();

  if (!store) {
    throw new Error(
      "Uploaden op Netlify vereist een Netlify Function-context of NETLIFY_SITE_ID en NETLIFY_AUTH_TOKEN.",
    );
  }

  await store.set(key, buffer, { metadata });
}

module.exports = {
  getConfiguredStore,
  readBinary,
  readJson,
  writeBinary,
  writeJson,
};
