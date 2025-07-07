import { getClient } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { FileObject } from '@supabase/storage-js';

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
  console.log('StorageUtils: getSignedUrl - Attempting to get signed URL for path:', path, 'bucket:', bucket);
  try {
    const supabase = getClient({ requiresAdmin: true });
    console.log('StorageUtils: getSignedUrl - Supabase client initialized');

    // Validate bucket name
    const validBuckets = ['sounds', 'videos'];
    if (!validBuckets.includes(bucket)) {
      console.error('StorageUtils: getSignedUrl - Invalid bucket name:', bucket);
      throw new StorageError(`Invalid bucket name: ${bucket}`);
    }
    console.log('StorageUtils: getSignedUrl - Bucket name validated');

    // Validate path exists
    if (!path) {
      console.error('StorageUtils: getSignedUrl - No path provided');
      throw new StorageError('No path provided');
    }
    console.log('StorageUtils: getSignedUrl - Path validated');

    // Remove bucket prefix if present for storage operations
    const storagePath = path.startsWith(`${bucket}/`) ? path.slice(bucket.length + 1) : path;
    console.log('StorageUtils: getSignedUrl - Creating signed URL for:', { bucket, path: storagePath });

    // Create signed URL with 1 hour expiration using corrected path
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600, {
        download: false
      });

    if (error) {
      console.error('StorageUtils: getSignedUrl - Supabase error creating signed URL:', error.message);
      throw new StorageError(`Supabase error: ${error.message}`);
    }

    if (!data?.signedUrl) {
      console.error('StorageUtils: getSignedUrl - No signed URL returned from Supabase');
      throw new StorageError('No signed URL returned from Supabase');
    }
    console.log('StorageUtils: getSignedUrl - Signed URL successfully generated');

    return data.signedUrl;
  } catch (error) {
    console.error('StorageUtils: getSignedUrl - Failed to get signed URL:', error);
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
  console.log('StorageUtils: uploadSound - Starting sound upload process');
  try {
    // Validate file size (50MB limit for Supabase free tier)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('StorageUtils: uploadSound - File size exceeds limit:', file.size);
      throw new StorageError(
        `File size exceeds 50MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );
    }
    console.log('StorageUtils: uploadSound - File size validated');

    // Create a unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const fileName = `${profileSlug}/${uuidv4()}.${fileExt}`;
    console.log('StorageUtils: uploadSound - Generated filename:', fileName);

    const supabase = getClient({ requiresAdmin: true });
    console.log('StorageUtils: uploadSound - Supabase client initialized for upload');

    // Upload to Supabase Storage with explicit content type
    console.log('StorageUtils: uploadSound - Attempting to upload file to Supabase Storage');
    const { data, error } = await supabase.storage
      .from('sounds')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    if (error) {
      console.error('StorageUtils: uploadSound - Supabase upload failed:', error.message);
      throw new StorageError(`Upload failed: ${error.message}`);
    }

    if (!data?.path) {
      console.error('StorageUtils: uploadSound - Upload successful but no path returned');
      throw new StorageError('Upload successful but no path returned');
    }
    console.log('StorageUtils: uploadSound - File uploaded to Supabase Storage. Path:', data.path);

    // Get signed URL with correct content type
    console.log('StorageUtils: uploadSound - Attempting to generate signed URL for uploaded file');
    const { data: urlData, error: urlError } = await supabase.storage
      .from('sounds')
      .createSignedUrl(data.path, 60 * 60, {
        download: false,
        transform: {
          format: 'origin'
        }
      });

    if (urlError || !urlData?.signedUrl) {
      console.error('StorageUtils: uploadSound - Failed to generate signed URL:', urlError?.message);
      throw new StorageError('Failed to generate signed URL');
    }
    console.log('StorageUtils: uploadSound - Signed URL generated:', urlData.signedUrl);

    return {
      path: data.path,
      signedUrl: urlData.signedUrl
    };
  } catch (error) {
    console.error('StorageUtils: uploadSound - Unexpected error during upload process:', error);
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
    const supabase = getClient({ requiresAdmin: true });
    const { error } = await supabase.storage.from('sounds').remove([path]);

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
    const supabase = getClient({ requiresAdmin: true });
    
    // List all files in the profile directory
    const { data: files, error: listError } = await supabase.storage
      .from('sounds')
      .list(profileSlug);

    if (listError) {
      throw new StorageError(`Failed to list files: ${listError.message}`);
    }

    if (!files?.length) {
      return; // No files to delete
    }

    // Delete all files in the profile directory
    const { error: deleteError } = await supabase.storage
      .from('sounds')
      .remove(files.map((file: FileObject) => `${profileSlug}/${file.name}`));

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