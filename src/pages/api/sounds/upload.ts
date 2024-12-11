import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('sound') as File;
    const profileId = formData.get('profileId') as string;
    const profileSlug = formData.get('profileSlug') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    // Validation checks...
    if (!file || !profileId || !name || !description) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400 }
      );
    }

    // File validation and saving logic remains the same...
    const publicDir = path.join(process.cwd(), 'public');
    const soundsDir = path.join(publicDir, 'sounds', profileSlug);
    await fs.mkdir(soundsDir, { recursive: true });

    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `${safeName}.mp3`;
    const filepath = path.join(soundsDir, filename);
    const filePath = `/sounds/${profileSlug}/${filename}`;

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filepath, buffer);

    // Create database entry
    const { data: newSound, error } = await supabase
      .from('sounds')
      .insert({
        name,
        description,
        file_path: filePath,
        profile_id: profileId,
      })
      .select()
      .single();

    if (error) {
      // Clean up file if database insert fails
      await fs.unlink(filepath);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        sound: newSound,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Upload failed',
      }),
      { status: 500 }
    );
  }
};
