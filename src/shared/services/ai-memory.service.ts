import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const getOpenAI = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not defined');
    }
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
};

export type EntityType = 'email' | 'meeting' | 'knowledge' | 'user_learning';

export interface MemoryEntry {
    content: string;
    entity_type: EntityType;
    entity_id: string;
    metadata?: any;
}

export class AiMemoryService {
    /**
     * Generates an embedding for a given text using OpenAI
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        const openai = getOpenAI();
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.replace(/\n/g, ' '),
        });
        return response.data[0].embedding;
    }

    /**
     * Stores a memory entry and its embedding in Supabase
     */
    static async storeMemory(entry: MemoryEntry, supabaseClient?: any) {
        const supabase = supabaseClient || await createClient();
        const embedding = await this.generateEmbedding(entry.content);

        const { error } = await supabase.from('embeddings' as any).insert({
            content: entry.content,
            entity_type: entry.entity_type,
            entity_id: entry.entity_id,
            embedding: embedding,
            metadata: entry.metadata || {},
        });

        if (error) {
            console.error('Error storing memory:', error);
            throw error;
        }
    }

    /**
     * Performs a semantic search across stored embeddings
     */
    static async searchMemory(query: string, limit: number = 5, threshold: number = 0.5, supabaseClient?: any) {
        const supabase = supabaseClient || await createClient();
        const queryEmbedding = await this.generateEmbedding(query);

        const { data, error } = await (supabase.rpc as any)('match_embeddings', {
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: limit,
        });

        if (error) {
            console.error('Error searching memory:', error);
            throw error;
        }

        return data;
    }

    /**
     * Deletes embeddings for a specific entity
     */
    static async deleteEntityMemories(entityId: string, entityType: EntityType, supabaseClient?: any) {
        const supabase = supabaseClient || await createClient();
        const { error } = await supabase
            .from('embeddings' as any)
            .delete()
            .eq('entity_id', entityId)
            .eq('entity_type', entityType);

        if (error) {
            console.error('Error deleting entity memories:', error);
            throw error;
        }
    }
}
