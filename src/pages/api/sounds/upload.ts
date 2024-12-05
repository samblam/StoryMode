import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { getSounds, saveSounds } from '../../../utils/soundUtils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('sound') as File;
    const profileId = formData.get('profileId') as string;
    const profileSlug = formData.get('profileSlug') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    
    // Detailed validation
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No sound file was provided' }),
        { status: 400 }
      );
    }
    
    if (!profileId || !profileSlug) {
      return new Response(
        JSON.stringify({ error: 'Sound profile information is missing' }),
        { status: 400 }
      );
    }

    if (!name || !description) {
      return new Response(
        JSON.stringify({ error: 'Name and description are required' }),
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'audio/mpeg') {
      return new Response(
        JSON.stringify({ 
          error: `Invalid file type: ${file.type}. Only MP3 files (audio/mpeg) are allowed.` 
        }),
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return new Response(
        JSON.stringify({ 
          error: `File size (${sizeMB}MB) exceeds the 5MB limit. Please compress your audio file.` 
        }),
        { status: 400 }
      );
    }

    // Create directory
    const publicDir = path.join(process.cwd(), 'public');
    const soundsDir = path.join(publicDir, 'sounds', profileSlug);
    
    try {
      await fs.mkdir(soundsDir, { recursive: true });
    } catch (error) {
      console.error('Directory creation error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create directory for sound file storage' 
        }),
        { status: 500 }
      );
    }

    // Generate safe filename
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `${safeName}.mp3`;
    const filepath = path.join(soundsDir, filename);

    // Save file
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filepath, buffer);
    } catch (error) {
      console.error('File write error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save sound file to server' 
        }),
        { status: 500 }
      );
    }

    // Update sounds data
    try {
      const sounds = await getSounds();
      sounds.push({
        id: crypto.randomUUID(),
        name,
        description,
        file: `/sounds/${profileSlug}/${filename}`,
        profileId
      });
      await saveSounds(sounds);
    } catch (error) {
      console.error('Database update error:', error);
      // Try to clean up the file if database update fails
      try {
        await fs.unlink(filepath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update sounds database' 
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        url: `/sounds/${profileSlug}/${filename}`
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error 
          ? `Upload failed: ${error.message}` 
          : 'An unexpected error occurred during upload'
      }),
      { status: 500 }
    );
  }
};