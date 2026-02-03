const imap = require('imap-simple');

const config = {
    imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.IMAP_HOST || 'imap.hostinger.com',
        port: parseInt(process.env.IMAP_PORT || '993'),
        tls: true,
        authTimeout: 3000,
    }
};

async function checkFolders() {
    try {
        const connection = await imap.connect(config);
        const boxes = await connection.getBoxes();
        console.log('Folders found:');

        function printBoxes(boxGroup, prefix = '') {
            for (const key in boxGroup) {
                console.log(`${prefix}${key}`);
                if (boxGroup[key].children) {
                    printBoxes(boxGroup[key].children, prefix + '  ');
                }
            }
        }

        printBoxes(boxes);
        connection.end();
    } catch (e) {
        console.error('Error listing folders:', e.message);
    }
}

checkFolders();
