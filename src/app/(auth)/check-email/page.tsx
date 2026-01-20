import Link from 'next/link'

export default function CheckEmailPage() {
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
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
                    {/* Success Icon */}
                    <div className="w-20 h-20 mx-auto bg-lime-400/20 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            ¡Revisa tu email!
                        </h2>
                        <p className="text-gray-400">
                            Te hemos enviado un enlace de confirmación. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-500">
                            ¿No has recibido el email?{' '}
                            <button className="text-lime-400 hover:text-lime-300 transition-colors">
                                Reenviar
                            </button>
                        </p>
                    </div>

                    <Link
                        href="/login"
                        className="inline-block text-lime-400 hover:text-lime-300 transition-colors"
                    >
                        Volver al login
                    </Link>
                </div>
            </div>
        </div>
    )
}
