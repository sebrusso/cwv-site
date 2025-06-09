import { NextResponse } from 'next/server';
import { chat } from '../../../lib/ai/openaiWrapper';
import { getDefaultReasoningEffort } from '../../../lib/models/modelUtils';

interface BulkRequest {
  prompts: Array<{
    id: string;
    prompt: string;
  }>;
  model?: string;
}



export async function POST(req: Request) {
  try {
    const { prompts, model = 'gpt-4o' }: BulkRequest = await req.json();
    
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ error: 'Prompts array is required' }, { status: 400 });
    }

    if (prompts.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 prompts per request' }, { status: 400 });
    }

    console.log(`🔄 Bulk generating ${prompts.length} responses with model ${model}`);

    // Generate responses in parallel with a limit
    const results = await Promise.allSettled(
      prompts.map(async ({ id, prompt }) => {
        try {
          const completion = await chat({
            model,
            messages: [
              {
                role: 'user',
                content: `Continue this story in a creative and engaging way. Write 2-4 paragraphs that maintain the tone and style:\n\n"${prompt}"`,
              },
            ],
            max_tokens: 400,
            temperature: 0.8,
            reasoning_effort: getDefaultReasoningEffort(model),
          });

          const text = completion.choices[0]?.message?.content?.trim() || '';
          return { id, text, success: true };
        } catch (error) {
          console.error(`Failed to generate for prompt ${id}:`, error);
          return { id, text: '', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const responses = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: prompts[index].id,
          text: '',
          success: false,
          error: result.reason?.message || 'Request failed'
        };
      }
    });

    const successCount = responses.filter(r => r.success).length;
    console.log(`✅ Bulk generation completed: ${successCount}/${prompts.length} successful`);

    return NextResponse.json({
      success: true,
      responses,
      stats: {
        total: prompts.length,
        successful: successCount,
        failed: prompts.length - successCount
      }
    });

  } catch (error) {
    console.error('Bulk generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate bulk responses' },
      { status: 500 }
    );
  }
} 