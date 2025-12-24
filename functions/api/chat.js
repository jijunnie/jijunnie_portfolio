export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { message, systemPrompt } = await request.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        system: systemPrompt || 'You are a helpful assistant.',
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();

    // Check if response was cut off due to max_tokens
    const stopReason = data.stop_reason;
    
    // Handle different response structures - Anthropic API might return content as array or object
    let responseText = '';
    if (data.content && Array.isArray(data.content) && data.content.length > 0) {
      // Standard structure: content is an array
      if (data.content[0].text) {
        responseText = data.content[0].text;
      } else if (typeof data.content[0] === 'string') {
        responseText = data.content[0];
      }
    } else if (data.text) {
      // Alternative structure: direct text property
      responseText = data.text;
    } else if (typeof data.content === 'string') {
      // Content is a string directly
      responseText = data.content;
    }
    
    // Log for debugging
    console.log('API Response stop_reason:', stopReason);
    console.log('API Response text length:', responseText.length);
    console.log('API Response text preview:', responseText.substring(0, 100));
    
    // If response was cut off, add a note (though with 500 tokens this should be rare)
    if (stopReason === 'max_tokens' && responseText) {
      // Response was truncated, but we'll return what we have
      // The increased max_tokens should prevent this in most cases
      console.log('Response was truncated due to max_tokens limit');
    }

    return new Response(
      JSON.stringify({ 
        response: responseText || "I'm having trouble formulating a response. Could you try rephrasing your question?",
        stop_reason: stopReason,
        full_response: data // Include full response for debugging
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        response: "I'm having trouble right now. Email me at jijun.nie@ufl.edu! 📧",
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}