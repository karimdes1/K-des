
import { getStore } from "@netlify/blobs";

export default async (request) => {
    
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { keys } = await request.json();

    if (!Array.isArray(keys) || keys.length === 0) {
      return json({ error: "No keys provided" }, 400);
    }

    const store = getStore({
      name: "kdes-images",
      consistency: "strong",
    });

    const deleted = [];
    const failed = [];

    for (const key of keys) {
      try {
        // Safety: only allow keys inside known category folders
        const valid = /^(logos|packages|posters|websites)\//.test(key);
        if (!valid) {
          failed.push({ key, reason: "Invalid path" });
          continue;
        }

        await store.delete(key);
        deleted.push(key);
      } catch (err) {
        failed.push({ key, reason: err.message });
      }
    }

    return json({ success: true, deleted, failed });
  } catch (err) {
    return json({ error: err.message || "Delete failed" }, 500);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = {
  path: "/api/delete",
  method: "POST",
};