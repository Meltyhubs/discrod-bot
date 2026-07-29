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
const KAYITLI_ROL_ID = 'VERILECEK_ROL_ID_BURAYA'; // Verilecek rolün ID'si
const KAYITSIZ_ROL_ID = 'ALINACAK_ROL_ID_BURAYA'; // Varsa alınacak kayıtsız rolünün ID'si (Yoksa silin)

client.on('clientReady', () => {
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

        // 2. Girilen metinden sadece ID rakamlarını temizle (hem etiket hem ID çalışır)
        const cleanId = targetInput.replace(/[<@>]/g, '');

        try {
            // Sunucudan kullanıcıyı ID ile çek (önce önbelleğe, yoksa sunucuya sorar)
            const member = message.guild.members.cache.get(cleanId) || await message.guild.members.fetch(cleanId).catch(() => null);

            if (!member) {
                return message.reply("❌ Belirtilen ID veya etikete sahip kullanıcı bu sunucuda bulunamadı!");
            }

            // 3. İsim Değiştirme (İsim | Yaş)
            const yeniIsim = `${isim} | ${yas}`;
            await member.setNickname(yeniIsim);

            // 4. Rol Verme / Alma İşlemleri
            if (KAYITLI_ROL_ID && KAYITLI_ROL_ID !== 'VERILECEK_ROL_ID_BURAYA') {
                await member.roles.add(KAYITLI_ROL_ID);
            }
            if (KAYITSIZ_ROL_ID && KAYITSIZ_ROL_ID !== 'ALINACAK_ROL_ID_BURAYA') {
                await member.roles.remove(KAYITSIZ_ROL_ID);
            }

            // 5. Başarı Mesajı
            return message.channel.send(`✅ ${member} kişisinin adı **${yeniIsim}** olarak güncellendi ve kayıt rolü verildi!`);

        } catch (error) {
            console.error("Kayıt sırasında hata:", error);
            return message.reply("⚠️ Kullanıcının adı veya rolü değiştirilirken bir hata oluştu!\n**Kontrol et:** Botun rolü, değiştirmek istediğin üyenin/rolün üstünde mi?");
        }
    }
});

// Botu çalıştır (Token'ı Render üzerindeki Environment Variable'dan alır)
client.login(process.env.TOKEN);
