import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { generateHtmlModificationPrompt } from '../../prompts/htmlModificationPrompt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  const { content, userInstruction } = await request.json();

  const prompt = generateHtmlModificationPrompt(content, userInstruction);
  
  const stream = await anthropic.messages.create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
    model: 'claude-3-5-sonnet-20240620',
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.delta?.text || '';
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}