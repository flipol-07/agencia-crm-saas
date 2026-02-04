'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveFileMetadataAction, deleteFileAction, getSignedUrlAction } from '../actions/file-actions'
import type { ContactFile } from '@/types/database'
import { toast } from 'sonner'

interface FileSectionProps {
    contactId: string
}

export function FileSection({ contactId }: FileSectionProps) {
    const [files, setFiles] = useState<ContactFile[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    const fetchFiles = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('contact_files')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setFiles(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchFiles()
    }, [contactId])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const supabase = createClient()

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('No estás autenticado')
                return
            }

            const fileExt = file.name.split('.').pop()
            const fileName = `${contactId}/${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('contact-files')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Save metadata
            const { error: dbError } = await saveFileMetadataAction({
                contact_id: contactId,
                name: file.name,
                file_path: filePath,
                file_size: file.size,
                content_type: file.type,
                created_by: user.id
            })

            if (dbError) throw new Error(dbError)

            toast.success('Archivo subido correctamente')
            await fetchFiles()
        } catch (error: any) {
            console.error('Error uploading:', error)
            toast.error('Error al subir archivo: ' + error.message)
        } finally {
            setUploading(false)
            // Reset input
            e.target.value = ''
        }
    }

    const handleDelete = async (fileId: string, filePath: string) => {
        if (!confirm('¿Estás seguro de eliminar este archivo?')) return

        try {
            const { success, error } = await deleteFileAction(fileId, filePath)
            if (!success) throw new Error(error || 'Error desconocido')
            toast.success('Archivo eliminado')
            await fetchFiles()
        } catch (error: any) {
            toast.error('Error al eliminar: ' + error.message)
        }
    }

    const handleDownload = async (filePath: string, fileName: string) => {
        try {
            const { url, error } = await getSignedUrlAction(filePath)
            if (error || !url) throw new Error(error || 'No se pudo generar el enlace')

            window.open(url, '_blank')
        } catch (error: any) {
            toast.error('Error al descargar: ' + error.message)
        }
    }

    const getFileIcon = (contentType: string | null) => {
        const isImage = contentType?.startsWith('image/')
        const isPdf = contentType?.includes('pdf')

        if (isPdf) return (
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        )
        if (isImage) return (
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
        return (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )
    }

    const formatSize = (bytes: number | null) => {
        if (!bytes) return '0 B'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">📁 Archivos</h2>
                <div className="relative">
                    <input
                        type="file"
                        onChange={handleUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploading}
                    />
                    <button
                        disabled={uploading}
                        className="flex items-center gap-2 text-sm bg-[#8b5cf6] text-white px-3 py-1.5 rounded-lg hover:bg-[#7c3aed] disabled:opacity-50 transition-colors font-medium shadow-lg shadow-purple-500/20"
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Subiendo...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Subir
                            </>
                        )}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-6">
                    <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : files.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {files.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group">
                            <div className="flex items-center gap-3 min-w-0">
                                {getFileIcon(file.content_type)}
                                <div className="min-w-0">
                                    <p className="text-sm text-white font-medium truncate" title={file.name}>
                                        {file.name}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                        {formatSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDownload(file.file_path, file.name)}
                                    className="p-1.5 text-gray-400 hover:text-[#8b5cf6] transition-colors"
                                    title="Ver / Descargar"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(file.id, file.file_path)}
                                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                    title="Eliminar"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                    <p className="text-gray-500 text-sm font-medium">No hay archivos todavía</p>
                    <p className="text-[10px] text-gray-600 mt-1">Sube contratos o documentos del cliente</p>
                </div>
            )}
        </div>
    )
}
