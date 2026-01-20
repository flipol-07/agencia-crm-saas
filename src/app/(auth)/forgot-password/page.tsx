import Link from 'next/link'
import { ForgotPasswordForm } from '@/features/auth/components'

export default function ForgotPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo/Brand */}
                <div className="text-center">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-black tracking-tight text-white uppercase">
                            CRM
                        </h1>
                    </Link>
                    <p className="mt-2 text-gray-400">
                        Recupera tu contraseña
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <ForgotPasswordForm />
                </div>
            </div>
        </div>
    )
}
