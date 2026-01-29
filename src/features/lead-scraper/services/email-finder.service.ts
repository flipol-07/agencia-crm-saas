/**
 * Email Finder usando Playwright
 * 
 * Visita las páginas web de los negocios y extrae emails de:
 * 1. La página principal (footer, header)
 * 2. La página de Contacto
 * 3. La página de Aviso Legal / Política de Privacidad
 */

import type { Lead } from '../types/lead-scraper.types';

// Patrones de email
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Emails a ignorar
const IGNORED_EMAIL_PATTERNS = [
    /noreply/i,
    /no-reply/i,
    /donotreply/i,
    /newsletter/i,
    /support@/i,
    /info@wordpress/i,
    /info@wix/i,
    /example\.com/i,
    /test@/i,
    /admin@/i,
    /webmaster@/i,
];

// Dominios genéricos
const GENERIC_DOMAINS = [
    'gmail.com',
    'hotmail.com',
    'hotmail.es',
    'outlook.com',
    'outlook.es',
    'yahoo.com',
    'yahoo.es',
];

export interface EmailFinderConfig {
    pageTimeout?: number;
    maxPagesPerSite?: number;
    headless?: boolean;
}

export interface EmailFinderResult {
    url: string;
    emails: string[];
    corporateEmails: string[];
    genericEmails: string[];
    error?: string;
    pagesCrawled: number;
}

/**
 * Extrae emails de un texto
 */
function extractEmails(text: string): string[] {
    const matches = text.match(EMAIL_REGEX) || [];
    return matches.filter(email => {
        const lowerEmail = email.toLowerCase();
        return !IGNORED_EMAIL_PATTERNS.some(pattern => pattern.test(lowerEmail));
    });
}

/**
 * Clasifica un email como corporativo o genérico
 */
function isGenericEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return GENERIC_DOMAINS.includes(domain);
}

/**
 * Encuentra páginas de contacto en los enlaces
 */
function findContactPages(links: string[], baseUrl: string): string[] {
    const contactPatterns = [
        /contact/i,
        /contacto/i,
        /kontakt/i,
        /about/i,
        /sobre-nosotros/i,
        /quienes-somos/i,
        /legal/i,
        /aviso-legal/i,
        /privacidad/i,
        /privacy/i,
    ];

    return links
        .filter(link => {
            try {
                const url = new URL(link, baseUrl);
                if (url.origin !== new URL(baseUrl).origin) return false;
                return contactPatterns.some(pattern => pattern.test(url.pathname));
            } catch {
                return false;
            }
        })
        .slice(0, 3);
}

/**
 * Email Finder Service
 */
export class EmailFinderService {
    private config: Required<EmailFinderConfig>;
    private processedCount: number = 0;
    private emailsFoundCount: number = 0;

    constructor(config: EmailFinderConfig = {}) {
        this.config = {
            pageTimeout: config.pageTimeout ?? 10000,
            maxPagesPerSite: config.maxPagesPerSite ?? 3,
            headless: config.headless ?? true,
        };
    }

    /**
     * Busca emails en una URL
     */
    async findEmailsInUrl(url: string): Promise<EmailFinderResult> {
        const result: EmailFinderResult = {
            url,
            emails: [],
            corporateEmails: [],
            genericEmails: [],
            pagesCrawled: 0,
        };

        // Importar playwright dinámicamente
        let playwright;
        try {
            console.log(`[EmailFinder] Iniciando búsqueda para: ${url}`);
            playwright = await import('playwright');
        } catch (err) {
            console.error('[EmailFinder] Error importando Playwright:', err);
            result.error = 'Playwright no está instalado correctamente.';
            return result;
        }

        let browser;
        try {
            browser = await playwright.chromium.launch({
                headless: this.config.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Mejor compatibilidad en linux
            });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            });
            const page = await context.newPage();
            page.setDefaultTimeout(this.config.pageTimeout);

            try {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                result.pagesCrawled++;
                console.log(`[EmailFinder] Página principal cargada: ${url}`);
            } catch (error) {
                console.warn(`[EmailFinder] Error al cargar ${url}:`, error instanceof Error ? error.message : error);
                result.error = `No se pudo cargar: ${error}`;
                await browser.close();
                return result;
            }

            // Extraer texto y enlaces
            const mainContent = await page.evaluate(() => {
                return {
                    text: document.body?.innerText || '',
                    links: Array.from(document.querySelectorAll('a[href]'))
                        .map(a => (a as HTMLAnchorElement).href),
                };
            });

            let allEmails = extractEmails(mainContent.text);

            // Buscar en páginas de contacto
            const contactPages = findContactPages(mainContent.links, url);

            for (const contactUrl of contactPages.slice(0, this.config.maxPagesPerSite - 1)) {
                try {
                    console.log(`[EmailFinder] Visitando contacto: ${contactUrl}`);
                    await page.goto(contactUrl, { waitUntil: 'domcontentloaded' });
                    result.pagesCrawled++;
                    const contactContent = await page.evaluate(() => document.body?.innerText || '');
                    const emailsFound = extractEmails(contactContent);
                    allEmails = [...allEmails, ...emailsFound];
                } catch (error) {
                    // Ignorar errores en páginas secundarias
                }
            }

            // Deduplicar
            const uniqueEmails = [...new Set(allEmails.map(e => e.toLowerCase()))];
            console.log(`[EmailFinder] Terminado ${url}. Emails encontrados: ${uniqueEmails.length}`);

            result.emails = uniqueEmails;
            result.corporateEmails = uniqueEmails.filter(e => !isGenericEmail(e));
            result.genericEmails = uniqueEmails.filter(e => isGenericEmail(e));

            await browser.close();

        } catch (error) {
            result.error = `Error: ${error}`;
            if (browser) await browser.close();
        }

        return result;
    }

    /**
     * Enriquece leads con emails
     */
    async enrichLeadsWithEmails(
        leads: Lead[],
        onProgress?: (current: number, total: number, lead: Lead) => void
    ): Promise<Lead[]> {
        const leadsWithWebsite = leads.filter(lead => lead.website);
        const enrichedLeads: Lead[] = [];

        for (let i = 0; i < leadsWithWebsite.length; i++) {
            const lead = leadsWithWebsite[i];

            if (onProgress) {
                onProgress(i + 1, leadsWithWebsite.length, lead);
            }

            const result = await this.findEmailsInUrl(lead.website!);

            if (result.emails.length > 0) {
                const bestEmail = result.corporateEmails[0] || result.genericEmails[0];
                enrichedLeads.push({ ...lead, email: bestEmail });
                this.emailsFoundCount++;
            } else {
                enrichedLeads.push(lead);
            }

            this.processedCount++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Añadir leads sin website
        const leadsWithoutWebsite = leads.filter(lead => !lead.website);
        return [...enrichedLeads, ...leadsWithoutWebsite];
    }

    /**
     * Estadísticas
     */
    getStats(): { processed: number; emailsFound: number; successRate: number } {
        return {
            processed: this.processedCount,
            emailsFound: this.emailsFoundCount,
            successRate: this.processedCount > 0
                ? Math.round((this.emailsFoundCount / this.processedCount) * 100)
                : 0,
        };
    }
}

export function createEmailFinder(config?: EmailFinderConfig): EmailFinderService {
    return new EmailFinderService(config);
}
