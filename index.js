const { Client, GatewayIntentBits, EmbedBuilder, Partials, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// --- AYARLAR ---
const KAYIT_KANAL_ID = '1538284563254747196'; // Kayıt kanalının ID'si
const KAYITLI_ROL_ID = '1520417528336355408';       // Verilecek Member rolünün ID'si
const KAYITSIZ_ROL_ID = '1520417529451774103';      // Alınacak Kayıtsız rolünün ID'si

// ⚡ TİKE VEYA ÇARPIYA BASMA YETKİSİ OLAN ROLLER
const YETKILI_ROLLER = [
    '1520417402729271366',
    '1520417403668795524'
];

client.on('ready', () => {
    console.log(`[BOT] ${client.user.tag} olarak başarıyla giriş yapıldı!`);
});

// 1. Kullanıcı isim yazınca otomatik ✅ ve ❌ ekleme
client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== KAYIT_KANAL_ID) return;

    try {
        await message.react('✅');
        await message.react('❌');
    } catch (error) {
        console.error("Tepki eklenirken hata oluştu:", error);
    }
});

// 2. Yetkili tepkilere bastığında işlem yapma
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Mesaj çekilirken hata oluştu:', error);
            return;
        }
    }

    // Sadece belirlenen kanal ve geçerli tepkileri kontrol et
    if (reaction.message.channel.id !== KAYIT_KANAL_ID) return;
    if (!['✅', '❌'].includes(reaction.emoji.name)) return;

    const guild = reaction.message.guild;
    const reactorMember = await guild.members.fetch(user.id).catch(() => null);

    if (!reactorMember) return;

    // Yetki Kontrolü
    const isAuthorized = reactorMember.permissions.has(PermissionsBitField.Flags.Administrator) ||
        YETKILI_ROLLER.some(roleId => reactorMember.roles.cache.has(roleId));

    if (!isAuthorized) {
        await reaction.users.remove(user.id).catch(() => null);
        return;
    }

    const targetUser = reaction.message.author;
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) return;

    // --- ❌ REDDETME İŞLEMİ ---
    if (reaction.emoji.name === '❌') {
        try {
            // Hatalı yazılan mesajı temizle
            await reaction.message.delete().catch(() => null);

            // Reddedildi Embed Mesajı Gönder
            const redEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`<@${user.id}> Tarafından\n<@${targetUser.id}> üyesinin **isim başvurusu reddedildi.** Lütfen ismi düzgün yazarak tekrar deneyin.`)
                .setFooter({ text: `${guild.name} | Otomatik Kayıt Sistemi` });

            await reaction.message.channel.send({ embeds: [redEmbed] });
        } catch (error) {
            console.error("Reddetme işleminde hata:", error);
        }
        return;
    }

    // --- ✅ ONAYLAMA İŞLEMİ ---
    if (reaction.emoji.name === '✅') {
        if (KAYITLI_ROL_ID && targetMember.roles.cache.has(KAYITLI_ROL_ID)) return;

        const yeniIsim = reaction.message.content.trim();

        try {
            // İsim Güncelleme
            await targetMember.setNickname(yeniIsim);

            // Rol İşlemleri
            if (KAYITLI_ROL_ID) await targetMember.roles.add(KAYITLI_ROL_ID);
            if (KAYITSIZ_ROL_ID) await targetMember.roles.remove(KAYITSIZ_ROL_ID);

            // Onay Embed Mesajı
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`<@${user.id}> Tarafından\n**İsminiz onaylandı.** Keyifli vakit geçir.`)
                .setFooter({ text: `${guild.name} | Otomatik Kayıt Sistemi` });

            await reaction.message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error("Kayıt onaylanırken hata oluştu:", error);
            await reaction.message.channel.send(`⚠️ <@${targetUser.id}> üyesinin kaydı yapılırken hata oluştu!\n**Hata:** \`${error.message}\``);
        }
    }
});

client.login(process.env.TOKEN);
