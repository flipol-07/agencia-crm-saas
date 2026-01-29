
// require('dotenv').config({ path: '.env.local' });
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');

async function testConnection() {
    console.log('--- TEST CONEXIÓN IMAP ---');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Host:', process.env.IMAP_HOST);
    console.log('Port:', process.env.IMAP_PORT);

    const config = {
        imap: {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASSWORD,
            host: process.env.IMAP_HOST || 'imap.hostinger.com',
            port: parseInt(process.env.IMAP_PORT || '993'),
            tls: true,
            authTimeout: 10000,
        }
    };

    try {
        console.log('Conectando...');
        const connection = await imap.connect(config);
        console.log('CONECTADO EXITOSAMENTE');

        console.log('Abriendo INBOX...');
        await connection.openBox('INBOX');
        console.log('INBOX abierto');

        console.log('Buscando correos de: lorentano@gmail.com ...');
        const contactEmail = 'lorentano@gmail.com';
        const searchCriteria = [
            ['OR', ['FROM', contactEmail], ['TO', contactEmail]]
        ];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: false,
            struct: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        // const recentMessages = messages.slice(-3); // Mostrar todos los encontrados (pocos)

        console.log(`Encontrados ${messages.length} mensajes coincidientes.`);

        for (const item of messages) {
            const all = item.parts.find((part) => part.which === '');
            if (all && all.body) {
                const parsed = await simpleParser(all.body);
                console.log(`- [${parsed.date}] De: ${parsed.from.text} | Asunto: ${parsed.subject}`);
            }
        }

        connection.end();
        console.log('--- FIN TEST ---');

    } catch (error) {
        console.error('ERROR EN CONEXIÓN:', error);
    }
}

testConnection();
