'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { processMeeting } from '../actions/process-meeting'
import { useContacts } from '@/features/contacts/hooks/useContacts'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface UploadMeetingModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function UploadMeetingModal({ isOpen, onClose, onSuccess }: UploadMeetingModalProps) {
    const { contacts } = useContacts()
    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [contactId, setContactId] = useState('')
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState('')
    const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file')
    const [transcriptText, setTranscriptText] = useState('')
    const ffmpegRef = useRef<FFmpeg | null>(null)

    if (!isOpen) return null

    const extractAudio = async (videoFile: File): Promise<File> => {
        // Initialize FFmpeg locally
        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg()
        }
        const ffmpeg = ffmpegRef.current

        // Cargar ffmpeg solo si no está cargado
        if (!ffmpeg.loaded) {
            setProgress('Cargando motor de conversión...')
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            })
        }

        setProgress('Extrayendo audio...')
        const inputName = 'input.mp4'
        const outputName = 'output.mp3'

        await ffmpeg.writeFile(inputName, await fetchFile(videoFile))

        // Comprimir a MP3 Mono 32k (optimizado para voz)
        await ffmpeg.exec(['-i', inputName, '-vn', '-ac', '1', '-b:a', '32k', outputName])

        const data = await ffmpeg.readFile(outputName)
        const blob = new Blob([data as any], { type: 'audio/mpeg' })

        return new File([blob], 'audio.mp3', { type: 'audio/mpeg' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (uploadMode === 'file' && !file) return
        if (uploadMode === 'text' && !transcriptText) return
        if (!title) return

        setUploading(true)
        const toastId = toast.loading('Iniciando proceso...')

        try {
            let filePath = ''

            // 1. Process or Upload
            if (uploadMode === 'text') {
                // If it's text, we DON'T upload to Supabase, we send it directly in FormData
                // This avoids MIME type restrictions on the storage bucket
            } else {
                if (!file) return
                let fileToUpload = file

                // 1.1 Extraer Audio en el Cliente (Navegador) - Solo para videos
                if (file.type.startsWith('video/')) {
                    toast.loading('Extrayendo audio del video para optimizar subida...', { id: toastId })
                    try {
                        fileToUpload = await extractAudio(file)
                        console.log(`Video original: ${file.size} bytes -> Audio extraído: ${fileToUpload.size} bytes`)
                    } catch (ffmpegError) {
                        console.error('Error ffmpeg wasm:', ffmpegError)
                        toast.warning('No se pudo extraer audio en el cliente. Se subirá el original.', { id: toastId })
                    }
                }

                // 2. Upload to Supabase Storage
                toast.loading('Subiendo archivo optimizado...', { id: toastId })
                const supabaseClient = createClient()
                const fileExt = fileToUpload.name.split('.').pop() || 'mp3'
                const fileName = `${crypto.randomUUID()}.${fileExt}`
                filePath = `${fileName}`

                const contentType = fileToUpload.type || 'application/octet-stream'
                const { error: uploadError } = await supabaseClient.storage
                    .from('meetings-temp')
                    .upload(filePath, fileToUpload, {
                        contentType: contentType === 'text/plain' ? 'application/octet-stream' : contentType
                    })

                if (uploadError) throw new Error(`Error subiendo archivo: ${uploadError.message}`)
            }

            // 3. Process with Server Action
            toast.loading('Analizando con IA...', { id: toastId })
            const formData = new FormData()
            if (uploadMode === 'text') {
                formData.append('transcriptText', transcriptText)
            } else {
                formData.append('filePath', filePath)
            }

            formData.append('title', title)
            formData.append('date', date)
            formData.append('contactId', contactId)

            const result = await processMeeting(formData)

            if (result.error) {
                throw new Error(result.error)
            }

            toast.success('Reunión procesada correctamente', { id: toastId })
            onSuccess?.()
            onClose()

            // Reset form
            setFile(null)
            setTitle('')
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al procesar', { id: toastId })
        } finally {
            setUploading(false)
            setProgress('')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!uploading ? onClose : undefined} />

            <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Nueva Reunión</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                            placeholder="Ej: Reunión semanal de marketing"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Fecha</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Contacto (Opcional)</label>
                        <select
                            value={contactId}
                            onChange={e => setContactId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lime-400 focus:outline-none"
                        >
                            <option value="">Seleccionar contacto...</option>
                            {contacts.map(c => (
                                <option key={c.id} value={c.id}>{c.company_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            type="button"
                            onClick={() => setUploadMode('file')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${uploadMode === 'file' ? 'bg-lime-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Subir Archivo
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode('text')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${uploadMode === 'text' ? 'bg-lime-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Pegar Texto
                        </button>
                    </div>

                    {uploadMode === 'file' ? (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Video/Audio/TXT de la reunión</label>
                            <div className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="video/*,audio/*,.txt"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {file ? (
                                    <div className="text-center">
                                        <p className="text-lime-400 text-sm font-medium break-all">{file.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">Arrastra o selecciona un archivo</p>
                                )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                {uploading && progress ? (
                                    <span className="text-lime-400 animate-pulse">{progress}</span>
                                ) : "Soporta Video, Audio o Transcripciones (TXT de Fathom)."}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Transcripción (Ctrl+V)</label>
                            <textarea
                                value={transcriptText}
                                onChange={e => setTranscriptText(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lime-400 focus:outline-none min-h-[150px] text-sm font-mono"
                                placeholder="Pega aquí la transcripción de Fathom..."
                                required
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex-1 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Procesando...
                                </>
                            ) : 'Procesar Reunión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
