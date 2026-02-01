'use client'

import { Card } from '@/shared/components/ui/Card'
import Link from 'next/link'
import type { ProjectProgressData } from '../services/dashboard.service'

interface ProjectProgressProps {
    projects: ProjectProgressData[]
    loading?: boolean
}

export function ProjectProgress({ projects, loading }: ProjectProgressProps) {
    if (loading) {
        return (
            <Card className="p-6 h-full">
                <div className="h-full animate-pulse bg-white/5 rounded-xl" />
            </Card>
        )
    }

    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                    Proyectos Activos
                </h3>
                <Link href="#" className="text-xs text-text-muted hover:text-brand transition-colors cursor-default">
                    Ver todos →
                </Link>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <p className="text-text-muted text-sm">Sin proyectos activos</p>
                        <p className="text-text-muted/60 text-xs mt-1">Crea un proyecto para verlo aquí</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <div
                            key={project.id}
                            className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-text-primary text-sm truncate group-hover:text-brand transition-colors">
                                        {project.name}
                                    </h4>
                                    <p className="text-xs text-text-muted mt-0.5 truncate">
                                        {project.clientName}
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-brand ml-2">
                                    {project.progressPercent}%
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand to-brand/70 rounded-full transition-all duration-500"
                                    style={{ width: `${project.progressPercent}%` }}
                                />
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
                                <span>{project.completedTasks}/{project.totalTasks} tareas</span>
                                {project.deadline && (
                                    <span className={`flex items-center gap-1 ${new Date(project.deadline) < new Date() ? 'text-red-400' : ''
                                        }`}>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(project.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    )
}
