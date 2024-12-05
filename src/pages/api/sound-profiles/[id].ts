import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { getSoundProfiles, saveSoundProfiles } from '../../../utils/profileUtils';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Profile ID is required' }),
        { status: 400 }
      );
    }

    // Get current profiles
    const profiles = await getSoundProfiles();
    const profileIndex = profiles.findIndex(p => p.id === id);
    
    if (profileIndex === -1) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404 }
      );
    }

    const profile = profiles[profileIndex];
    
    // Delete associated sound files
    const publicDir = path.join(process.cwd(), 'public');
    const profileDir = path.join(publicDir, 'sounds', profile.slug);
    
    try {
      await fs.rm(profileDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting sound files:', error);
    }

    // Remove profile from list
    profiles.splice(profileIndex, 1);
    await saveSoundProfiles(profiles);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile deletion error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to delete profile' 
      }),
      { status: 500 }
    );
  }
};