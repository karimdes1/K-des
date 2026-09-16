import { getStore } from "@netlify/blobs";

export default async () => {
  try {
    const store = getStore({
      name: "kdes-images",
      consistency: "strong",
    });

    const categories = ["logos", "packages", "posters", "websites"];
    const result = {};

    for (const cat of categories) {
      const { blobs } = await store.list({ prefix: `${cat}/` });

      result[cat] = await Promise.all(
        blobs.map(async (b) => {
          const meta = await store.getMetadata(b.key);
          const md = (meta && meta.metadata) || {};
          return {
            key: b.key,
            url: `/uploads/${b.key}`,
            uploadedAt: md.uploadedAt || "",
            subtype: md.subtype || "",
          };
        })
      );

      // Sort by uploadedAt ascending (oldest first)
      result[cat].sort((a, b) => {
        if (!a.uploadedAt) return -1;
        if (!b.uploadedAt) return 1;
        return a.uploadedAt.localeCompare(b.uploadedAt);
      });
    }

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/list",
  method: "GET",
};