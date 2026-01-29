'use client'

import { useState, useRef, useEffect } from 'react'

interface ServiceTagSelectorProps {
    selectedTags: string[]
    onChange: (tags: string[]) => void
}

const PREDEFINED_TAGS = [
    'IA',
    'Web',
    'Consultoría',
    'SEO',
    'SEM',
    'Apps Móviles',
    'Automatización',
    'Diseño',
]

export function ServiceTagSelector({ selectedTags, onChange }: ServiceTagSelectorProps) {
    const [inputValue, setInputValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Filtrar tags predefinidos que no están seleccionados y coinciden con el input
    const suggestions = PREDEFINED_TAGS.filter(
        tag => !selectedTags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
    )

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag(inputValue)
        } else if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1])
        }
    }

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim()
        if (trimmedTag && !selectedTags.includes(trimmedTag)) {
            onChange([...selectedTags, trimmedTag])
            setInputValue('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        onChange(selectedTags.filter(tag => tag !== tagToRemove))
    }

    // Cerrar sugerencias al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={containerRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Servicios *
            </label>
            <div
                className={`w-full min-h-[50px] px-3 py-2 bg-white/5 border rounded-lg flex flex-wrap gap-2 items-center transition-all cursor-text ${isFocused ? 'border-lime-400 ring-1 ring-lime-400' : 'border-white/10'}`}
                onClick={() => inputRef.current?.focus()}
            >
                {selectedTags.map(tag => (
                    <span
                        key={tag}
                        className="bg-lime-400/20 text-lime-400 px-2 py-1 rounded-md text-sm flex items-center gap-1 border border-lime-400/30"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                            className="hover:text-white transition-colors"
                        >
                            ×
                        </button>
                    </span>
                ))}

                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    className="bg-transparent border-none outline-none text-white placeholder-gray-500 min-w-[120px] flex-1"
                    placeholder={selectedTags.length === 0 ? "Ej: IA, Web..." : ""}
                />
            </div>

            {/* Sugerencias Dropdown */}
            {isFocused && (inputValue || suggestions.length > 0) && (
                <div className="mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-10 p-1">
                    {suggestions.length > 0 ? (
                        suggestions.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => addTag(tag)}
                                className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-md transition-colors text-sm"
                            >
                                + {tag}
                            </button>
                        ))
                    ) : null}

                    {inputValue && !selectedTags.includes(inputValue) && (
                        <button
                            type="button"
                            onClick={() => addTag(inputValue)}
                            className="w-full text-left px-3 py-2 text-lime-400 hover:bg-white/10 rounded-md transition-colors text-sm font-medium border-t border-white/5"
                        >
                            Crear "{inputValue}"
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
