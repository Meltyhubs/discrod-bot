const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const express = require('express');

// --- 1. RENDER 7/24 UYKU ENGELLEYİCİ SUNUCU ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot 7/24 Aktif!'));
app.listen(PORT, () => console.log(`[HTTP] Sunucu ${PORT} portunda dinleniyor.`));

// --- 2. DISCORD CLIENT KURULUMU ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- 3. AYARLAR VE YETKİLİ ROL LİSTESİ ---
const AYARLAR = {
    PREFIX: '.hrr',
    UNREGISTERED_ROLE: 'Kayıtsız', // Kayıtsız rolünün tam adı
    MEMBER_ROLE: 'Member',          // Verilecek yeni rolün tam adı
    AUTHORIZED_ROLES: [
        'HRR', 'FOUNDER', 'The Hrr', 'Owner', 
        'Rigel of Hrr', 'Vespera of Hrr', 'King', 
        'Revoir of Hrr', 'Satan of Hrr', 'Diamente of Hrr', 'Ceo'
    ]
};

client.on('ready', () => {
    console.log(`[BOT] ${client.user.tag} olarak giriş yapıldı!`);
});

client.on('messageCreate', async (message) => {
    // Botların mesajlarını ve prefix ile başlamayan mesajları yoksay
    if (message.author.bot || !message.content.startsWith(AYARLAR.PREFIX)) return;

    // --- YETKİ KONTROLÜ ---
    const isAdministrator = message.member.permissions.has(PermissionFlagsBits.Administrator);
    const hasAuthorizedRole = message.member.roles.cache.some(role => 
        AYARLAR.AUTHORIZED_ROLES.includes(role.name)
    );

    if (!isAdministrator && !hasAuthorizedRole) {
        return message.channel.send('❌ **Hata:** Bu komutu kullanmak için yetkiniz bulunmuyor!').then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        });
    }

    // Mesajı gönderen kişinin komut mesajını sil
    message.delete().catch(err => console.log('Mesaj silinemedi:', err));

    // --- ARGÜMANLARI AYRIŞTIRMA (.hrr @Kullanıcı İsim Yaş) ---
    const args = message.content.slice(AYARLAR.PREFIX.length).trim().split(/ +/);
    const targetMember = message.mentions.members.first();

    if (!targetMember) {
        return message.channel.send('❌ **Hata:** Lütfen kayıt edilecek bir kullanıcıyı etiketleyin! Örnek: `.hrr @Kullanıcı Süleyman 26`').then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        });
    }

    // Etiket haricindeki diğer kelimeleri al (İsim ve Yaş)
    const nameAgeArgs = args.filter(arg => !arg.includes(targetMember.id));
    
    if (nameAgeArgs.length < 2) {
        return message.channel.send('❌ **Hata:** Lütfen isim ve yaş bilgilerini eksiksiz girin! Örnek: `.hrr @Kullanıcı Süleyman 26`').then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        });
    }

    const age = nameAgeArgs.pop(); // Son argümanı yaş olarak al
    const name = nameAgeArgs.join(' '); // Geri kalanı isim yap
    const newNickname = `${name} | ${age}`;

    try {
        // 1. İsim Değiştirme
        await targetMember.setNickname(newNickname);

        // 2. Kayıtsız Rolünü Kaldır
        const unregisteredRole = message.guild.roles.cache.find(r => r.name === AYARLAR.UNREGISTERED_ROLE);
        if (unregisteredRole && targetMember.roles.cache.has(unregisteredRole.id)) {
            await targetMember.roles.remove(unregisteredRole);
        }

        // 3. Member Rolünü Ver
        const memberRole = message.guild.roles.cache.find(r => r.name === AYARLAR.MEMBER_ROLE);
        if (memberRole) {
            await targetMember.roles.add(memberRole);
        } else {
            message.channel.send(`⚠️ **Uyarı:** Sunucuda **${AYARLAR.MEMBER_ROLE}** adında bir rol bulunamadı, roller güncellenemedi.`);
        }

        // Başarı Mesajı
        message.channel.send(`✅ **Başarılı:** ${targetMember} kullanıcısının ismi \`${newNickname}\` olarak güncellendi ve kaydı tamamlandı.`);

    } catch (error) {
        console.error(error);
        message.channel.send('❌ **Hata:** İşlem gerçekleştirilirken bir sorun oluştu! Botun yetkilerini ve rol sıralamasını kontrol edin.');
    }
});

client.login(process.env.TOKEN);