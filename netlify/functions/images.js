import { getStore } from "@netlify/blobs";

export default async (request, context) => {
  // Path after /uploads/ is the key
  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.replace(/^\/uploads\//, ""));

  if (!key) {
    return new Response("Not found", { status: 404 });
  }

  const store = getStore({
    name: "kdes-images",
    consistency: "strong",
  });

  // Get blob + metadata
  const blob = await store.getWithMetadata(key, { type: "arrayBuffer" });

  if (!blob) {
    return new Response("Image not found", { status: 404 });
  }

  const contentType =
    (blob.metadata && blob.metadata.contentType) || "image/jpeg";

  return new Response(blob.data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export const config = {
  path: "/uploads/*",
  method: "GET",
};