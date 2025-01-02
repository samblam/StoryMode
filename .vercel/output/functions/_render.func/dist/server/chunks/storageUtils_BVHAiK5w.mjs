import { supabaseAdmin } from './supabase_D4M8dM3h.mjs';
import { v4 } from 'uuid';

class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = "StorageError";
  }
}
async function getSignedUrl(path) {
  try {
    const { data, error } = await supabaseAdmin.storage.from("sounds").createSignedUrl(path, 60 * 60, {
      download: false,
      transform: {
        format: "origin"
      }
    });
    if (error) throw error;
    if (!data?.signedUrl) throw new Error("No signed URL returned");
    return data.signedUrl;
  } catch (error) {
    throw new StorageError(
      `Failed to get signed URL: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
async function uploadSound({
  file,
  profileSlug,
  contentType
}) {
  try {
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new StorageError(
        `File size exceeds 50MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );
    }
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const fileName = `${profileSlug}/${v4()}.${fileExt}`;
    const { data, error } = await supabaseAdmin.storage.from("sounds").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType
    });
    if (error) {
      throw new StorageError(`Upload failed: ${error.message}`);
    }
    if (!data?.path) {
      throw new StorageError("Upload successful but no path returned");
    }
    const { data: urlData, error: urlError } = await supabaseAdmin.storage.from("sounds").createSignedUrl(data.path, 60 * 60, {
      download: false,
      transform: {
        format: "origin"
      }
    });
    if (urlError || !urlData?.signedUrl) {
      throw new StorageError("Failed to generate signed URL");
    }
    return {
      path: data.path,
      signedUrl: urlData.signedUrl
    };
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(
      `Unexpected error during upload: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export { getSignedUrl as g, uploadSound as u };
