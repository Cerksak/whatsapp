const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth()
});

const sourceGroup = "Mobil Park Polisi Projesi"; // Takip edilen grup
const targetGroup = "Beşiktaş Jk"; // Mesajların gönderileceği grup
const keyword = "aranıyor"; // Filtreleme kelimesi

client.on('ready', async () => {
    console.log('✅ Bot Bağlandı ve Hazır!');

    let chats = await client.getChats();
    let sourceChat = chats.find(chat => chat.name === sourceGroup);
    let targetChat = chats.find(chat => chat.name === targetGroup);

    if (!sourceChat) {
        console.log(`❌ "${sourceGroup}" grubu bulunamadı!`);
        return;
    }
    
    if (!targetChat) {
        console.log(`❌ "${targetGroup}" grubu bulunamadı!`);
        return;
    }

    console.log(`🔍 "${sourceGroup}" grubundaki son 1000 mesaj kontrol ediliyor...`);

    try {
        let messages = await sourceChat.fetchMessages({ limit: 1000 });

        let filteredMessages = messages
            .filter(msg => msg.body.toLowerCase().includes(keyword))
            .map(msg => `${msg.author || msg.from}: ${msg.body}`);

        if (filteredMessages.length > 0) {
            // Mesajları dosyaya kaydet
            fs.writeFileSync('filtreli_mesajlar.txt', filteredMessages.join('\n') + '\n', 'utf8');
            console.log(`✅ ${filteredMessages.length} adet mesaj kaydedildi.`);

            // Hedef gruba mesajları gönder
            for (let msg of filteredMessages) {
                await targetChat.sendMessage(msg);
            }

            console.log(`📩 Filtrelenen eski mesajlar "${targetGroup}" grubuna gönderildi.`);
        } else {
            console.log("ℹ️ Son 1000 mesaj içinde uygun mesaj bulunamadı.");
        }
    } catch (err) {
        console.error("❌ Hata:", err);
    }

    console.log(`👀 Yeni mesajlar takip ediliyor...`);
});

// **Yeni gelen mesajları takip et ve hedef gruba gönder**
client.on('message', async msg => {
    try {
        let chat = await msg.getChat();

        if (chat.isGroup && chat.name === sourceGroup && msg.body.toLowerCase().includes(keyword)) {
            let formattedMessage = `${msg.author || msg.from}: ${msg.body}`;

            // Mesajı dosyaya ekle
            fs.appendFileSync('filtreli_mesajlar.txt', formattedMessage + '\n', 'utf8');
            console.log(`✅ Yeni mesaj kaydedildi: ${formattedMessage}`);

            // Hedef gruba mesajı gönder
            let chats = await client.getChats();
            let targetChat = chats.find(chat => chat.name === targetGroup);

            if (targetChat) {
                await targetChat.sendMessage(formattedMessage);
                console.log(`📩 Yeni mesaj "${targetGroup}" grubuna gönderildi.`);
            } else {
                console.log("❌ Hedef grup bulunamadı!");
            }
        }
    } catch (err) {
        console.error("❌ Hata:", err);
    }
});

client.initialize();

