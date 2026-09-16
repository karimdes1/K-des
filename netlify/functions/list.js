import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore({
    name: "kdes-images",
    consistency: "strong",
  });

  const categories = ["logos", "packages", "posters", "websites"];
  const result = {};

  for (const cat of categories) {
    const { blobs } = await store.list({ prefix: `${cat}/` });
    result[cat] = blobs.map((b) => ({
      key: b.key,
      url: `/uploads/${b.key}`,
    }));
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/list",
  method: "GET",
};