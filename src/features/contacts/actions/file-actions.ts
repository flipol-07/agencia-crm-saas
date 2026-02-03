'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { ContactFileInsert } from '@/types/database'

export async function saveFileMetadataAction(metadata: ContactFileInsert) {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('contact_files') as any)
        .insert(metadata)
        .select()
        .single()

    if (error) {
        console.error('[File Action] Error saving metadata:', error)
        return { data: null, error: error.message }
    }

    return { data, error: null }
}

export async function deleteFileAction(fileId: string, filePath: string) {
    const supabase = await createClient()

    // 1. Delete from storage
    const { error: storageError } = await supabase.storage
        .from('contact-files')
        .remove([filePath])

    if (storageError) {
        console.error('[File Action] Error deleting from storage:', storageError)
        return { success: false, error: storageError.message }
    }

    // 2. Delete metadata
    const { error: dbError } = await (supabase.from('contact_files') as any)
        .delete()
        .eq('id', fileId)

    if (dbError) {
        console.error('[File Action] Error deleting metadata:', dbError)
        return { success: false, error: dbError.message }
    }

    return { success: true, error: null }
}

export async function getSignedUrlAction(filePath: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.storage
        .from('contact-files')
        .createSignedUrl(filePath, 3600)

    if (error) {
        console.error('[File Action] Error generating signed URL:', error)
        return { url: null, error: error.message }
    }
    return { url: data.signedUrl, error: null }
}
