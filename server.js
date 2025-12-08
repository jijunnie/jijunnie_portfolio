import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Initialize Anthropic Client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemPrompt } = req.body;

    console.log('📨 Received message:', message);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY not found in environment');
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    console.log('🤖 Calling Claude API...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: systemPrompt || 'You are a helpful assistant.',
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    const responseText = response.content[0].text;
    console.log('✅ Claude response:', responseText);

    res.json({ response: responseText });

  } catch (error) {
    console.error('❌ Anthropic API Error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });

    // Handle specific errors
    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        response: "API key issue! Email me at jijun.nie@ufl.edu 📧"
      });
    }

    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        response: "I'm getting too many questions! Try again in a moment 😅"
      });
    }

    if (error.status === 400) {
      return res.status(400).json({ 
        error: 'Bad request',
        details: error.message,
        response: "Something went wrong with that question. Try asking differently!"
      });
    }

    res.status(500).json({ 
      error: 'Failed to get response',
      details: error.message,
      response: "I'm having trouble right now. Email me at jijun.nie@ufl.edu! 📧"
    });
  }
});

app.listen(PORT, () => {
  console.log('================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🔑 API Key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
  console.log('================================');
});
