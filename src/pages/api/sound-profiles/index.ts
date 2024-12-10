import type { APIRoute } from 'astro';
import { getSoundProfiles, saveSoundProfiles } from '../../../utils/profileUtils';
import type { SoundProfile } from '../../../types/sound';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    if (!data.title || !data.description) {
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        { status: 400 }
      );
    }

    const profiles = await getSoundProfiles();
    
    // Create new profile
    const newProfile: SoundProfile = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    profiles.push(newProfile);
    await saveSoundProfiles(profiles);

    return new Response(
      JSON.stringify(newProfile),
      { status: 201 }
    );
  } catch (error) {
    console.error('Profile creation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to create profile' 
      }),
      { status: 500 }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    if (!data.id || !data.title || !data.description) {
      return new Response(
        JSON.stringify({ error: 'ID, title, and description are required' }),
        { status: 400 }
      );
    }

    const profiles = await getSoundProfiles();
    const profileIndex = profiles.findIndex(p => p.id === data.id);
    
    if (profileIndex === -1) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404 }
      );
    }

    // Update profile
    profiles[profileIndex] = {
      ...profiles[profileIndex],
      title: data.title,
      description: data.description,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    await saveSoundProfiles(profiles);

    return new Response(
      JSON.stringify(profiles[profileIndex]),
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      }),
      { status: 500 }
    );
  }
};