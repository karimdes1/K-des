import { getStore } from "@netlify/blobs";

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await request.formData();
    const category = formData.get("category");
    const subtype = formData.get("subtype"); // "logo" | "banner" | null
    const files = formData.getAll("files");

    const validCategories = ["logos", "packages", "posters", "websites"];
    if (!validCategories.includes(category)) {
      return json({ error: "Invalid category" }, 400);
    }

    if (!files || files.length === 0) {
      return json({ error: "No files provided" }, 400);
    }

    const store = getStore({
      name: "kdes-images",
      consistency: "strong",
    });

    const uploaded = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      if (!file.type.startsWith("image/")) continue;

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      let key;

      if (category === "packages" && subtype) {
        // ✅ Force fixed names so logo & banner can never mix
        if (subtype === "logo") {
          key = `packages/logo/current.${ext}`;
        } else if (subtype === "banner") {
          key = `packages/banner/current.${ext}`;
        } else {
          return json({ error: "Invalid package subtype" }, 400);
        }
      } else {
        // Other categories: keep unique names (multiple allowed)
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        key = `${category}/${unique}.${ext}`;
      }

      await store.set(key, file, {
        metadata: {
          contentType: file.type,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          category,
          subtype: subtype || "",
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

    return json({ success: true, uploaded });
  } catch (err) {
    return json({ error: err.message || "Upload failed" }, 500);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = {
  path: "/api/upload",
  method: "POST",
};