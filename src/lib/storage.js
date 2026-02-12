import { supabase } from "./supabase";

function extFromName(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

function rand() {
  return Math.random().toString(16).slice(2);
}

export async function uploadImagesToProductsBucket(files) {
  const bucket = "products";
  const urls = [];

  for (const file of files) {
    const ext = extFromName(file.name);
    const path = `products/${Date.now()}_${rand()}${ext || ""}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}
