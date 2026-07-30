const { Client, GatewayIntentBits } = require('discord.js');

// Botun ihtiyaç duyduğu izinler (Intents)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- AYARLAR ---
const PREFIX = '.'; // Komut ön takısı
const KAYITLI_ROL_ID = '1520417528336355408'; // Buraya kopyaladığın Member rol ID'sini yapıştır
const KAYITSIZ_ROL_ID = '1520417529451774103'; // Varsa alınacak kayıtsız rolünün ID'si (Yoksa kalsın)

client.on('ready', () => {
    console.log(`[BOT] ${client.user.tag} olarak başarıyla giriş yapıldı!`);
});

client.on('messageCreate', async (message) => {
    // Bot mesajlarını ve prefix ile başlamayan mesajları yok say
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Komut: .hrr <ID veya Etiket> <İsim> <Yaş>
    if (command === 'hrr') {
        const targetInput = args[0];
        const isim = args[1];
        const yas = args[2];

        // 1. Eksik parametre kontrolü
        if (!targetInput || !isim || !yas) {
            return message.reply("❌ **Hatalı Kullanım!**\nDoğru format: `.hrr <ID veya Etiket> <İsim> <Yaş>`\nÖrnek: `.hrr 453982019485761536 Ahmet 22`");
        }

        // 2. Girilen metinden SAYI OLMAYAN HER ŞEYİ TEMİZLE
        const cleanId = targetInput.replace(/\D/g, '');

        if (!cleanId) {
            return message.reply("❌ Geçerli bir Kullanıcı ID'si veya Etiket belirtmediniz!");
        }

        try {
            // Sunucudan kullanıcıyı çek
            let member = message.guild.members.cache.get(cleanId);
            if (!member) {
                member = await message.guild.members.fetch(cleanId).catch(() => null);
            }

            if (!member) {
                return message.reply(`❌ **${cleanId}** ID'sine sahip kullanıcı bu sunucuda bulunamadı!`);
            }

            // 3. İsim Değiştirme
            const yeniIsim = `${isim} | ${yas}`;
            await member.setNickname(yeniIsim);

            // 4. Rol Verme / Alma
            if (KAYITLI_ROL_ID && KAYITLI_ROL_ID !== 'MEMBER_ROL_ID_BURAYA') {
                await member.roles.add(KAYITLI_ROL_ID);
            }
            if (KAYITSIZ_ROL_ID && KAYITSIZ_ROL_ID !== 'ALINACAK_ROL_ID_BURAYA') {
                await member.roles.remove(KAYITSIZ_ROL_ID);
            }

            return message.channel.send(`✅ ${member} kişisinin adı **${yeniIsim}** olarak güncellendi ve **Member** rolü verildi!`);

        } catch (error) {
            console.error("Kayıt sırasında hata:", error);
            return message.reply(`⚠️ İşlem başarısız oldu!\n**Hata Kodu:** \`${error.message}\``);
        }
    }
});

// Botu çalıştır
client.login(process.env.TOKEN);
