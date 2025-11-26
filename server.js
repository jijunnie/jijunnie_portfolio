import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  console.log('=== CHAT API CALLED ===');
  
  const { message, systemPrompt } = req.body;

  if (!message || !systemPrompt) {
    return res.status(400).json({ error: 'Message and systemPrompt are required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('API Key exists:', !!apiKey);

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log('Making request to Anthropic API...');
    console.log('Using model: claude-3-haiku-20240307');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      return res.status(response.status).json({ 
        error: 'API Error', 
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('✅ Success!');

    if (data.content && data.content.length > 0 && data.content[0].text) {
      return res.json({ 
        response: data.content[0].text 
      });
    } else {
      return res.status(500).json({ 
        error: 'Unexpected response format'
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});