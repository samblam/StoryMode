import { supabaseAdmin } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
  file: File;
  profileSlug: string;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export async function getSignedUrl(path: string): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('sounds')
      .createSignedUrl(path, 60 * 60); // 1 hour expiry

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('No signed URL returned');

    return data.signedUrl;
  } catch (error) {
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
}: UploadOptions): Promise<{
  path: string;
  signedUrl: string;
}> {
  try {
    // Validate file size (50MB limit for Supabase free tier)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      throw new StorageError(
        `File size exceeds 50MB limit. Current size: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`
      );
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      throw new StorageError(
        'Invalid file type. Please upload audio files only.'
      );
    }

    // Create a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${profileSlug}/${uuidv4()}.${fileExt}`;

    // Upload to Supabase Storage using admin client
    const { data, error } = await supabaseAdmin.storage
      .from('sounds')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new StorageError(`Upload failed: ${error.message}`);
    }

    if (!data?.path) {
      throw new StorageError('Upload successful but no path returned');
    }

    // Get a signed URL for immediate use
    const signedUrl = await getSignedUrl(data.path);

    return {
      path: data.path,
      signedUrl,
    };
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(
      `Unexpected error during upload: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
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

export async function deleteSoundsByProfile(
  profileSlug: string
): Promise<void> {
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
