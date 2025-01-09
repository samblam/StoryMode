import { supabaseAdmin } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
  file: File;
  profileSlug: string;
  contentType: string;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export async function getSignedUrl(path: string, bucket: string): Promise<string> {
  try {
    // Validate bucket name
    const validBuckets = ['sounds', 'videos'];
    if (!validBuckets.includes(bucket)) {
      throw new StorageError(`Invalid bucket name: ${bucket}`);
    }

    // Validate path exists
    if (!path) {
      throw new StorageError('No path provided');
    }

    // Create signed URL with 1 hour expiration
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 3600, {
        download: false
      });

    if (error) {
      throw new StorageError(`Supabase error: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new StorageError('No signed URL returned from Supabase');
    }

    return data.signedUrl;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(
      `Failed to get signed URL: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function uploadSound({
  file,
  profileSlug,
  contentType
}: UploadOptions): Promise<{
  path: string;
  signedUrl: string;
}> {
  try {
    // Validate file size (50MB limit for Supabase free tier)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new StorageError(
        `File size exceeds 50MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );
    }

    // Create a unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const fileName = `${profileSlug}/${uuidv4()}.${fileExt}`;

    // Upload to Supabase Storage with explicit content type
    const { data, error } = await supabaseAdmin.storage
      .from('sounds')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    if (error) {
      throw new StorageError(`Upload failed: ${error.message}`);
    }

    if (!data?.path) {
      throw new StorageError('Upload successful but no path returned');
    }

    // Get signed URL with correct content type
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('sounds')
      .createSignedUrl(data.path, 60 * 60, {
        download: false,
        transform: {
          format: 'origin'
        }
      });

    if (urlError || !urlData?.signedUrl) {
      throw new StorageError('Failed to generate signed URL');
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
      `Unexpected error during upload: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteSound(path: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage.from('sounds').remove([path]);

    if (error) {
      throw new StorageError(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(
      `Unexpected error during deletion: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function deleteSoundsByProfile(profileSlug: string): Promise<void> {
  try {
    // List all files in the profile directory
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('sounds')
      .list(profileSlug);

    if (listError) {
      throw new StorageError(`Failed to list files: ${listError.message}`);
    }

    if (!files?.length) {
      return; // No files to delete
    }

    // Delete all files in the profile directory
    const { error: deleteError } = await supabaseAdmin.storage
      .from('sounds')
      .remove(files.map((file) => `${profileSlug}/${file.name}`));

    if (deleteError) {
      throw new StorageError(`Failed to delete files: ${deleteError.message}`);
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(
      `Unexpected error during profile deletion: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}