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

      result[cat] = blobs
        .map((b) => {
          // Determine subtype from the key path
          let subtype = "";
          if (b.key.startsWith("packages/logo/")) subtype = "logo";
          else if (b.key.startsWith("packages/banner/")) subtype = "banner";

          return {
            key: b.key,
            url: `/uploads/${b.key}`,
            subtype,
            uploadedAt: b.uploadedAt || "",
          };
        })
        .sort((a, b) => {
          // For packages, sort logo before banner
          if (a.subtype && b.subtype) {
            if (a.subtype === "logo" && b.subtype === "banner") return -1;
            if (a.subtype === "banner" && b.subtype === "logo") return 1;
          }
          return (a.uploadedAt || "").localeCompare(b.uploadedAt || "");
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