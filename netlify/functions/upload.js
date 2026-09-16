import { getStore } from "@netlify/blobs";
import { randomUUID } from "crypto";

export default async (request, context) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await request.formData();
    const category = formData.get("category"); // logos | packages | posters | websites
    const files = formData.getAll("files");

    const validCategories = ["logos", "packages", "posters", "websites"];
    if (!validCategories.includes(category)) {
      return new Response(JSON.stringify({ error: "Invalid category" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Site-scoped store — persists across ALL deploys
    const store = getStore({
      name: "kdes-images",
      consistency: "strong",
    });

    const uploaded = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Validate it's an image
      if (!file.type.startsWith("image/")) {
        continue;
      }

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const key = `${category}/${randomUUID()}.${ext}`;

      await store.set(key, file, {
        metadata: {
          contentType: file.type,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          category,
        },
      });

      uploaded.push({
        key,
        url: `/uploads/${key}`,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    // Also return the current index of all images per category
    const index = await getCategoryIndex(store);

    return new Response(
      JSON.stringify({ success: true, uploaded, index }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Upload failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

async function getCategoryIndex(store) {
  const result = { logos: [], packages: [], posters: [], websites: [] };

  for (const cat of Object.keys(result)) {
    const { blobs } = await store.list({ prefix: `${cat}/` });
    result[cat] = blobs.map((b) => ({
      key: b.key,
      url: `/uploads/${b.key}`,
    }));
  }

  return result;
}

export const config = {
  path: "/api/upload",
  method: "POST",
};