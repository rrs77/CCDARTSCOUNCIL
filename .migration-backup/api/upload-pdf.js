/**
 * Vercel Serverless Function: Upload PDF to Supabase Storage.
 * Used when PDF is generated client-side and needs to be uploaded.
 *
 * POST body: { fileName: string, fileData: string (base64) }
 * Env: SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL or SUPABASE_URL
 */

import { createClient } from '@supabase/supabase-js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileName, fileData } = body || {};

    if (!fileName || !fileData) {
      return jsonResponse({ error: 'Missing fileName or fileData' }, 400);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return jsonResponse({ 
        error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set in Vercel. Please add it in Project Settings > Environment Variables.'
      }, 500);
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false
      }
    });

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileData, 'base64');

    // Upload to Supabase Storage
    const storageFileName = `shared-pdfs/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('lesson-pdfs')
      .upload(storageFileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true // Allow overwriting
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return jsonResponse({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('lesson-pdfs')
      .getPublicUrl(storageFileName);

    return jsonResponse({
      success: true,
      url: urlData.publicUrl,
      path: storageFileName
    });
  } catch (error) {
    console.error('upload-pdf error:', error);
    return jsonResponse(
      { error: error.message || 'Internal server error' },
      500
    );
  }
}
