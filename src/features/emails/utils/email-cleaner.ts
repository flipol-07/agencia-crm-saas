/**
 * Utility to clean email bodies from noise like headers, previous quotes, and signatures.
 */
export function cleanEmailBody(text: string): string {
    if (!text) return ''

    // 1. Remove common email headers block (From, Sent, To, Subject)
    // and horizontal lines often used by Outlook/Gmail
    let cleaned = text

    // Common splitters for reply threads
    const splitters = [
        /^[ \t]*From:[ \t]*/mi,
        /^[ \t]*De:[ \t]*/mi,
        /^[ \t]*Enviado el:[ \t]*/mi,
        /^[ \t]*Sent:[ \t]*/mi,
        /^[ \t]*---------- Original Message ----------/mi,
        /^[ \t]*________________________________/mi,
        /^[ \t]*--------------------------------/mi,
        /^[ \t]*El [a-z., ]+ [0-9]+ [a-z., ]+ [0-9]+ a las [0-9:]+[ ,a-z]+ escribid:/mi, // Outlook/Gmail style on date... wrote:
        /^[ \t]*On .* wrote:/mi
    ]

    for (const splitter of splitters) {
        const match = cleaned.match(splitter)
        if (match && match.index !== undefined) {
            // Only cut if it's not at the very beginning (to avoid empty messages)
            if (match.index > 5) {
                cleaned = cleaned.substring(0, match.index)
            }
        }
    }

    // 2. Remove leading/trailing markers of quotes
    cleaned = cleaned.replace(/^[ \t]*>[ \t]*/gm, '')

    // 3. Trim extra whitespace and newlines
    cleaned = cleaned.trim()

    return cleaned
}
