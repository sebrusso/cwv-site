import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { isValidLength } from '../../../lib/utils';
import { buildUnifiedChatRequest } from '../../../lib/ai/unifiedRequestBuilder';
import { generateText } from '../../../lib/models/aiService';
import { getSystemInstruction } from '../../../lib/systemInstructions';
import { countWords, countParagraphs } from '../../../lib/text-utils.js';
import { getUserIdForApi } from '@/lib/auth-utils';
import { getServerConfig } from '@/lib/server-config';
import { checkRateLimit } from '@/lib/rateLimiter';

async function handleGenerateOpenAI(
  fetchFn: typeof fetch,
  { prompt, model, params, referenceStory }: { 
    prompt: string; 
    model: string; 
    params?: { temperature?: number; max_tokens?: number; stop?: string[] };
    referenceStory?: string;
  },
) {
  if (!isValidLength(prompt, 1, 500)) {
    return NextResponse.json(
      { error: 'Prompt must be between 1 and 500 characters' },
      { status: 400 },
    );
  }

  try {
    let text: string;
    let refWords: number | undefined;
    let refParas: number | undefined;
    let genTokens: number | undefined;

    if (referenceStory) {
      // Use unified request builder for reference story-based generation
      const balancedRequest = buildUnifiedChatRequest({
        prompt,
        model,
        referenceStory,
        customParams: params
      });
      
      // Calculate reference story stats for logging
      refWords = countWords(referenceStory);
      refParas = countParagraphs(referenceStory);
      genTokens = balancedRequest.max_tokens || balancedRequest.max_completion_tokens;

      // Use the unified OpenAI wrapper instead of direct API call
      const { chat } = await import('../../../lib/ai/openaiWrapper');
      
      const response = await chat({
        model: balancedRequest.model,
        messages: balancedRequest.messages,
        max_tokens: balancedRequest.max_tokens || balancedRequest.max_completion_tokens,
        temperature: balancedRequest.temperature,
        top_p: balancedRequest.top_p,
        frequency_penalty: balancedRequest.frequency_penalty,
        presence_penalty: balancedRequest.presence_penalty,
        stop: balancedRequest.stop,
        reasoning_effort: balancedRequest.reasoning_effort,
      });

      text = response.choices?.[0]?.message?.content || '';
      
      // Remove the end token if present
      text = text.replace(/<\|endofstory\|>/g, '').trim();
    } else {
      // Use existing generateText service for backward compatibility
      text = await generateText(fetchFn, {
        prompt,
        model,
        systemMessage: getSystemInstruction(model),
        params,
      });
    }

    // Log generation statistics to console for debugging
    if (referenceStory) {
      console.log('StoryLength-Balancer stats:', {
        refWords,
        refParas,
        genTokens,
        genWords: countWords(text),
        genParas: countParagraphs(text)
      });
    }

    return NextResponse.json({ text, refWords, refParas, genTokens });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, model, params, referenceStory } = await req.json();

    const cookieStorePromise = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: async () => (await cookieStorePromise).getAll(),
          setAll: async (
            cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
          ) => {
            try {
              const store = await cookieStorePromise;
              cookiesToSet.forEach(({ name, value, options }) => {
                store.set(name, value, options as CookieOptions);
              });
            } catch {
              // ignore cookie errors
            }
          },
        }
      }
    );

    const userId = await getUserIdForApi(supabase);
    const cookieStore = await cookieStorePromise;
    const anonId =
      cookieStore.get('anonymous_session_id')?.value ||
      cookieStore.get('anonymousSessionId')?.value ||
      null;

    const id = userId || anonId || req.headers.get('x-forwarded-for') || 'unknown';
    const isAnon = !userId;

    const cfg = getServerConfig().api.rateLimit;
    if (
      cfg.enabled &&
      !checkRateLimit(id, isAnon, {
        userMax: cfg.userMaxRequests,
        anonMax: cfg.anonMaxRequests,
        windowMs: cfg.windowMs,
      })
    ) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    return handleGenerateOpenAI(fetch, { prompt, model, params, referenceStory });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 },
    );
  }
}
