import type { APIRoute, APIContext } from 'astro';
import { getClient } from '../../../lib/supabase';
import { put } from '@vercel/blob';
import { validateBody } from '../../../utils/validationMiddleware';
import { validateFile, sanitizeInput, normalizeFileName } from '../../../utils/validation';
import type { User } from '../../../types/auth';
import type { AppLocals } from 'src/types/app';

export const POST: APIRoute = async ({ request, locals }: APIContext & { locals: AppLocals }) => {
  const supabaseClient = getClient();
  const authUser = locals?.auth?.user as User;

  if (!authUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('sound') as File;

    const fileError = validateFile(file);
    if (fileError) {
      return new Response(
        JSON.stringify({ success: false, error: fileError }),
        { status: 400 }
      );
    }

    const validation = await validateBody({
      name: 'name',
      description: 'description'
    })(request);

    if (validation instanceof Response) {
      return validation;
    }

    const { body } = validation;
    const name = sanitizeInput(body.name);
    const description = sanitizeInput(body.description);
    const normalizedFileName = normalizeFileName(file.name);
    const userId = authUser.id;
    const filePath = `sounds/${userId}/${normalizedFileName}`;

    const { data, error } = await supabaseClient
      .from('sounds')
      .insert([{ 
        name, 
        description,
        file_path: filePath,
        user_id: userId
      }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ success: false, error: 'Failed to save sound metadata.' }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const blobResult = await put(filePath, file, {
      access: 'public',
    });

    return new Response(JSON.stringify({ 
      success: true, 
      blobUrl: blobResult.url,
      supabaseData: data
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to upload sound.' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};