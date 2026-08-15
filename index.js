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
const KAYIT_KANAL_ID = '1520417679364853850';       // İsim yazılacak kanalın ID'si
const KAYITLI_ROL_ID = '1520417528336355408';      // Verilecek Member rolünün ID'si
const KAYITSIZ_ROL_ID = '1520417529451774103';   // Alınacak Kayıtsız rolünün ID'si

// ⚡ TİKE BASMA YETKİSİ OLAN YÜKSEK RÜTBELİ ROLLER (Bunlardan Herhangi Biri Basabilir)
const YETKILI_ROLLER = [
    '1520417402729271366',
    '1520417403668795524'
];

client.on('ready', () => {
    console.log(`[BOT] ${client.user.tag} olarak başarıyla giriş yapıldı!`);
});

// 1. Kullanıcı isim yazınca otomatik ✅ ekleme
client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== KAYIT_KANAL_ID) return;

    try {
        await message.react('✅');
    } catch (error) {
        console.error("Tepki eklenirken hata oluştu:", error);
    }
});

// 2. Yetkili tike basınca kaydı onaylama
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

    if (reaction.message.channel.id !== KAYIT_KANAL_ID || reaction.emoji.name !== '✅') return;

    const guild = reaction.message.guild;
    const reactorMember = await guild.members.fetch(user.id).catch(() => null);

    if (!reactorMember) return;

    // Tike basan kişinin Yönetici yetkisi var mı veya Yetkili Roller listenizdeki bir role sahip mi?
    const isAuthorized = reactorMember.permissions.has(PermissionsBitField.Flags.Administrator) ||
        YETKILI_ROLLER.some(roleId => reactorMember.roles.cache.has(roleId));

    // Yetkisi olmayan biri tike basarsa tepkisini sil
    if (!isAuthorized) {
        await reaction.users.remove(user.id).catch(() => null);
        return;
    }

    const targetUser = reaction.message.author;
    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) return;
    
    // Zaten kayıt edilmişse tekrar işlem yapma
    if (KAYITLI_ROL_ID && targetMember.roles.cache.has(KAYITLI_ROL_ID)) return;

    const yeniIsim = reaction.message.content.trim();

    try {
        // İsim Güncelleme
        await targetMember.setNickname(yeniIsim);

        // Rol İşlemleri
        if (KAYITLI_ROL_ID && KAYITLI_ROL_ID !== 'MEMBER_ROL_ID_BURAYA') {
            await targetMember.roles.add(KAYITLI_ROL_ID);
        }
        if (KAYITSIZ_ROL_ID && KAYITSIZ_ROL_ID !== 'KAYITSIZ_ROL_ID_BURAYA') {
            await targetMember.roles.remove(KAYITSIZ_ROL_ID);
        }

        // Onaylayan Yetkiliyi Gösteren Yeşil Embed Mesajı
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`<@${user.id}> Tarafından\n**İsminiz onaylandı.** İyi Roller Dileriz.`)
            .setFooter({ text: `${guild.name} | Otomatik Kayıt Sistemi` });

        await reaction.message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error("Kayıt onaylanırken hata oluştu:", error);
        await reaction.message.channel.send(`⚠️ <@${targetUser.id}> üyesinin kaydı yapılırken hata oluştu!\n**Hata:** \`${error.message}\``);
    }
});

client.login(process.env.TOKEN);
