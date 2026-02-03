import { createClient } from '@/lib/supabase/server';
import { Contact } from '@/types/database';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ContactAnalysisResult {
    probability_close: number;
    inactivity_status: 'active' | 'warning' | 'inactive';
    ai_suggestions: { action: string; reason: string }[];
    analysis_summary: string;
}

export async function analyzeContact(contactId: string): Promise<ContactAnalysisResult> {
    const supabase = await createClient();

    // 1. Fetch Contact Data & History
    const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

    if (contactError || !contactData) {
        throw new Error('Contact not found');
    }

    const contact = contactData as Contact;

    // Fetch recent interactions (emails, meetings, notes)
    const { data: emails } = await supabase
        .from('contact_emails')
        .select('subject, content, received_at, direction')
        .or(`sender.eq.${contact.email},recipient.eq.${contact.email}`)
        .order('received_at', { ascending: false })
        .limit(5);

    const { data: meetings } = await supabase
        .from('meetings')
        .select('title, summary, date, key_points')
        .eq('contact_id', contactId)
        .order('date', { ascending: false })
        .limit(3);

    // 2. Prepare Prompt for AI
    const prompt = `
        Analyze the following B2B sales opportunity (Contact) and provide a scoring and strategic advice.

        CONTACT CONTEXT:
        - Name: ${contact.contact_name}
        - Company: ${contact.company_name}
        - Pipeline Stage: ${contact.pipeline_stage || 'Unknown'}
        - Estimated Value: ${contact.estimated_value || '0'}
        - Status: ${contact.status || 'Active'}
        - Last Interaction: ${contact.last_interaction || 'N/A'}

        RECENT EMAILS:
        ${JSON.stringify(emails, null, 2)}

        RECENT MEETINGS:
        ${JSON.stringify(meetings, null, 2)}

        TASK:
        1. Calculate "Probability of Close" (0-100%) based on engagement, tone, and stage.
        2. Determine "Inactivity Status": 'active' (<15 days since meaningful interaction), 'warning' (15-30 days), 'inactive' (>30 days).
        3. Provide 3 specific, actionable suggestions to move this deal forward.

        IMPORTANT:
        - ALL TEXT OUTPUT (suggestions, reasons, summary) MUST BE IN SPANISH (ESPAÑOL).
        - The "action" and "reason" fields in suggestions must be in Spanish.
        - The "analysis_summary" must be in Spanish.

        OUTPUT FORMAT (JSON ONLY):
        {
            "probability_close": number,
            "inactivity_status": "active" | "warning" | "inactive",
            "ai_suggestions": [
                { "action": "string (Spanish)", "reason": "string (Spanish)" },
                { "action": "string (Spanish)", "reason": "string (Spanish)" },
                { "action": "string (Spanish)", "reason": "string (Spanish)" }
            ],
            "analysis_summary": "string (Spanish)"
        }
    `;

    // 3. Call OpenAI
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are a senior sales strategist and CRM expert.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content received from AI');

    const analysis = JSON.parse(content) as ContactAnalysisResult;

    // 4. Update Database
    const { error: updateError } = await (supabase
        .from('contacts') as any)
        .update({
            probability_close: analysis.probability_close,
            inactivity_status: analysis.inactivity_status,
            ai_suggestions: analysis.ai_suggestions,
            ai_description: analysis.analysis_summary,
            last_analyzed_at: new Date().toISOString()
        })
        .eq('id', contactId);

    if (updateError) {
        console.error('Update Error:', updateError);
        throw updateError;
    }

    return analysis;
}
