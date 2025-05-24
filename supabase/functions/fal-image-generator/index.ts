import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// fal.ai API settings
const FAL_API_KEY = Deno.env.get('FAL_API_KEY') || '';
const FAL_API_BASE = 'https://fal.run/fal-ai';

// Storage settings
const STORAGE_BUCKET = 'user-content';
const IMAGE_EXPIRY_DAYS = 7;

// Daily limits for free usage
const DAILY_LIMITS = {
  textToImage: 10,   // FLUX schnell - fast and affordable
  imageToImage: 5,   // FLUX dev redux - higher quality
  upscaler: 5        // ESRGAN - very affordable
};

// Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

console.log('Fal Image Generator starting...');
console.log('FAL_API_KEY present:', FAL_API_KEY ? 'Yes (length: ' + FAL_API_KEY.length + ')' : 'No');

// Rate limiting function
async function checkDailyLimit(userId: string, operationType: keyof typeof DAILY_LIMITS): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}_${operationType}_${today}`;
  
  try {
    // Check current usage from a rate limiting table (you'd need to create this)
    const { data, error } = await supabaseAdmin
      .from('image_generation_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('operation_type', operationType)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Rate limit check error:', error);
      return false;
    }

    const currentCount = data?.count || 0;
    const limit = DAILY_LIMITS[operationType];
    
    console.log(`Daily limit check - User: ${userId}, Operation: ${operationType}, Current: ${currentCount}, Limit: ${limit}`);
    
    return currentCount < limit;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return false; // Fail safe - deny if we can't check
  }
}

// Update usage count
async function updateUsageCount(userId: string, operationType: keyof typeof DAILY_LIMITS): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { error } = await supabaseAdmin
      .from('image_generation_usage')
      .upsert({
        user_id: userId,
        operation_type: operationType,
        date: today,
        count: 1
      }, {
        onConflict: 'user_id,operation_type,date',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Usage update error:', error);
    }
  } catch (error) {
    console.error('Failed to update usage:', error);
  }
}

// Text to Image using FLUX.1 [schnell]
async function generateTextToImage(prompt: string, options: any = {}): Promise<any> {
  const requestBody = {
    prompt,
    image_size: options.image_size || 'landscape_4_3',
    num_inference_steps: options.num_inference_steps || 4,
    seed: options.seed,
    num_images: 1,
    enable_safety_checker: true,
    sync_mode: true
  };

  console.log('Calling FLUX schnell for text-to-image:', requestBody);

  const response = await fetch(`${FAL_API_BASE}/flux/schnell`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FAL API Error:', response.status, errorText);
    throw new Error(`FAL API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Image to Image using FLUX.1 [dev] Redux
async function generateImageToImage(prompt: string, imageUrl: string, options: any = {}): Promise<any> {
  const requestBody = {
    prompt,
    image_url: imageUrl,
    strength: options.strength || 0.8,
    num_inference_steps: options.num_inference_steps || 28,
    guidance_scale: options.guidance_scale || 3.5,
    seed: options.seed,
    num_images: 1,
    enable_safety_checker: true,
    sync_mode: true
  };

  console.log('Calling FLUX dev redux for image-to-image:', requestBody);

  const response = await fetch(`${FAL_API_BASE}/flux/dev/redux`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FAL API Error:', response.status, errorText);
    throw new Error(`FAL API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Upscaler using ESRGAN
async function upscaleImage(imageUrl: string, options: any = {}): Promise<any> {
  const requestBody = {
    image_url: imageUrl,
    scale: options.scale || 2,
    model: options.model || 'RealESRGAN_x4plus',
    face: options.face || false,
    output_format: 'png'
  };

  console.log('Calling ESRGAN for upscaling:', requestBody);

  const response = await fetch(`${FAL_API_BASE}/esrgan`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FAL API Error:', response.status, errorText);
    throw new Error(`FAL API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Store image to Supabase storage
async function storeImage(imageUrl: string): Promise<any> {
  try {
    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image');
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    // Generate filename with expiry
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + IMAGE_EXPIRY_DAYS);
    const expiryTimestamp = expiry.getTime();
    const fileName = `images/fal_${Date.now()}_exp${expiryTimestamp}_${Math.random().toString(36).substring(2, 9)}.png`;

    console.log(`Storing image to Supabase: ${fileName}`);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, imageArrayBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
        metadata: {
          expiry: String(expiryTimestamp),
          source: 'fal-ai'
        }
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Return original URL as fallback
      return {
        url: imageUrl,
        contentType,
        fallback: true,
        error: uploadError.message
      };
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      contentType,
      expiry: expiryTimestamp,
      expiryDate: expiry.toISOString()
    };
  } catch (error) {
    console.error('Image storage error:', error);
    // Return original URL as fallback
    return {
      url: imageUrl,
      contentType: 'image/png',
      fallback: true,
      error: error.message
    };
  }
}

Deno.serve(async (req) => {
  console.log(`${new Date().toISOString()} - Request received: ${req.method}, URL: ${req.url}`);

  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // Check API key
    if (!FAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'FAL API key not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Parse request body
    const {
      operation, // 'text-to-image', 'image-to-image', 'upscaler'
      prompt,
      image_url,
      user_id,
      ...options
    } = await req.json();

    // Validate required parameters
    if (!operation) {
      return new Response(JSON.stringify({ error: 'Operation type is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Map operation to rate limit key
    const operationMap: Record<string, keyof typeof DAILY_LIMITS> = {
      'text-to-image': 'textToImage',
      'image-to-image': 'imageToImage',
      'upscaler': 'upscaler'
    };

    const rateLimitKey = operationMap[operation];
    if (!rateLimitKey) {
      return new Response(JSON.stringify({ error: 'Invalid operation type' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check daily limit (if user_id provided)
    if (user_id) {
      const canProceed = await checkDailyLimit(user_id, rateLimitKey);
      if (!canProceed) {
        return new Response(JSON.stringify({ 
          error: 'Daily limit exceeded',
          limit: DAILY_LIMITS[rateLimitKey],
          operation: operation
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    let result;

    // Execute operation
    switch (operation) {
      case 'text-to-image':
        if (!prompt) {
          return new Response(JSON.stringify({ error: 'Prompt is required for text-to-image' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        result = await generateTextToImage(prompt, options);
        break;

      case 'image-to-image':
        if (!prompt || !image_url) {
          return new Response(JSON.stringify({ error: 'Prompt and image_url are required for image-to-image' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        result = await generateImageToImage(prompt, image_url, options);
        break;

      case 'upscaler':
        if (!image_url) {
          return new Response(JSON.stringify({ error: 'Image_url is required for upscaling' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        result = await upscaleImage(image_url, options);
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid operation type' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }

    // Store the generated image and get a stable URL
    let finalResult;
    if (operation === 'upscaler') {
      // Upscaler returns { image: { url, ... } }
      const originalImageUrl = result.image?.url;
      if (originalImageUrl) {
        const storedImage = await storeImage(originalImageUrl);
        finalResult = {
          ...result,
          image: {
            ...result.image,
            url: storedImage.url,
            stored: !storedImage.fallback,
            expiry: storedImage.expiry,
            expiryDate: storedImage.expiryDate
          }
        };
      } else {
        finalResult = result;
      }
    } else {
      // Text-to-image and image-to-image return { images: [{ url, ... }] }
      const originalImageUrl = result.images?.[0]?.url;
      if (originalImageUrl) {
        const storedImage = await storeImage(originalImageUrl);
        finalResult = {
          ...result,
          images: [{
            ...result.images[0],
            url: storedImage.url,
            stored: !storedImage.fallback,
            expiry: storedImage.expiry,
            expiryDate: storedImage.expiryDate
          }]
        };
      } else {
        finalResult = result;
      }
    }

    // Update usage count (if user_id provided)
    if (user_id) {
      await updateUsageCount(user_id, rateLimitKey);
    }

    console.log('Image generation completed successfully');
    
    return new Response(JSON.stringify(finalResult), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('Server error:', error);
    
    const errorResponse = {
      error: `Server error: ${error.message}`,
      errorType: error.message?.includes('Network') ? 'network_error' : 'api_error',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}); 