const { EventEmitter } = require("node:events");
const { connectLambda } = require("@netlify/blobs");

const routeHandlers = {
  "auth/login": require("../../api/auth/login"),
  "auth/logout": require("../../api/auth/logout"),
  "auth/session": require("../../api/auth/session"),
  "jobs-settings": require("../../api/jobs-settings"),
  jobs: require("../../api/jobs"),
  news: require("../../api/news"),
  projects: require("../../api/projects"),
  team: require("../../api/team"),
  uploads: require("../../api/uploads"),
};

function getRequestUrl(event) {
  return event.rawUrl || `https://${event.headers?.host || "localhost"}${event.path || "/"}`;
}

function getRoutePath(event) {
  const pathname = new URL(getRequestUrl(event)).pathname.replace(/\/+$/, "");
  const withoutFunctionPrefix = pathname.replace(/^\/\.netlify\/functions\/api/, "");
  return withoutFunctionPrefix.replace(/^\/api/, "").replace(/^\/+/, "");
}

function createRequest(event) {
  const request = new EventEmitter();
  const url = new URL(getRequestUrl(event));
  const body = event.body
    ? Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8")
    : Buffer.alloc(0);

  request.method = event.httpMethod || "GET";
  request.url = `${url.pathname}${url.search}`;
  request.headers = Object.fromEntries(
    Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]),
  );
  request.query = Object.fromEntries(url.searchParams.entries());
  request.destroy = () => request.emit("error", new Error("Request body too large."));

  process.nextTick(() => {
    if (body.length) {
      request.emit("data", body);
    }

    request.emit("end");
  });

  return request;
}

function createResponse() {
  const headers = {};
  let statusCode = 200;
  let responseBody = Buffer.alloc(0);

  return {
    setHeader(name, value) {
      headers[name] = value;
    },
    end(value = "") {
      responseBody = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
    },
    getResult() {
      const contentType = String(headers["Content-Type"] || headers["content-type"] || "");
      const isText = !contentType || /json|text|javascript|xml|css|html/i.test(contentType);

      return {
        statusCode,
        headers,
        body: isText ? responseBody.toString("utf8") : responseBody.toString("base64"),
        isBase64Encoded: !isText,
      };
    },
    get statusCode() {
      return statusCode;
    },
    set statusCode(value) {
      statusCode = Number(value) || 200;
    },
  };
}

function getHandler(event) {
  const routePath = getRoutePath(event);
  const segments = routePath.split("/").filter(Boolean);
  const routeKey = segments.slice(0, 2).join("/");
  const collectionKey = segments[0];
  const handler = routeHandlers[routeKey] || routeHandlers[collectionKey];

  if (!handler) {
    return null;
  }

  if (segments.length > 1 && ["projects", "jobs", "news", "team"].includes(collectionKey)) {
    const url = new URL(getRequestUrl(event));
    if (!url.searchParams.has("slug")) {
      event.queryStringParameters = {
        ...(event.queryStringParameters || {}),
        slug: segments.slice(1).join("/"),
      };
      event.rawUrl = `${url.origin}${url.pathname}?${new URLSearchParams({
        ...Object.fromEntries(url.searchParams.entries()),
        slug: segments.slice(1).join("/"),
      })}`;
    }
  }

  return handler;
}

exports.handler = async function handler(event) {
  // Netlify injects the Blobs context on Lambda events. This must happen
  // before any route accesses the shared storage adapter.
  if (event.blobs) {
    connectLambda(event);
  }

  const routeHandler = getHandler(event);

  if (!routeHandler) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "API-route niet gevonden." }),
    };
  }

  const request = createRequest(event);
  const response = createResponse();

  try {
    await routeHandler(request, response);
    return response.getResult();
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: error.message || "Serverfout." }),
    };
  }
};
