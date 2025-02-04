import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log('Test API endpoint called');
  
  return new Response(JSON.stringify({ 
    message: 'Test API endpoint working',
    method: request.method,
    url: request.url
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};