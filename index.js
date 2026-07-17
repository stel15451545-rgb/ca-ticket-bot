const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('CA Bot Alive'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CATS = { general: "1493988237830787155", internal: "1507523007524896888", highrank: "1507522925602013425" };
const ROLES = { staff: "1493988230406733874", hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"] };

client.once('ready', async () => {
    console.log(`✅ ONLINE ${client.user.tag}`);
    await client.application.commands.set([
        { name: 'ticket', description: 'Ticket', options: [
            { name: 'setup', description: 'Setup panel', type: 1 },
            { name: 'close', description: 'Close', type: 1 }
        ]},
        { name: 'session', description: 'Session', options: [
            { name: 'full', type: 1 }, { name: 'startup', type: 1, options: [{ name: 'text', type: 3, required: false }] },
            { name: 'vote', type: 1 }, { name: 'shutdown', type: 1 }
        ]}
    ]);
});

function panel() {
    const c = new ContainerBuilder().setAccentColor(0x2B2D31);
    // Foto varsa göster, yoksa yazı
    try { c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://assistance.png'))); } catch {}
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## California Roleplay\nWelcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.\n\n**General Support Ticket**\nGeneral questions, assistance with features or inquiries about our community rules.\n\n**Internal Affairs Ticket**\n• Staff Reports • Partnership • Questions\n\n**High Rank Ticket**\n• HR Reports • In-Game Bug Reports • Question For Ownership\n\n**2026 © California Roleplay.**`));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('select').setPlaceholder('Select Support Category').addOptions(
            { label: 'General Ticket', value: 'general', emoji: '📩' },
            { label: 'Internal Affairs Ticket', value: 'internal', emoji: '📩' },
            { label: 'High Rank Ticket', value: 'highrank', emoji: '📩' }
        )
    ));
    return c;
}

client.on('interactionCreate', async i => {
    if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
        try {
            await i.channel.send({ components: [panel()], files: [{ attachment: './assistance.png', name: 'assistance.png' }], flags: MessageFlags.IsComponentsV2 });
        } catch { // foto yoksa fotosuz at
            await i.channel.send({ components: [panel()], flags: MessageFlags.IsComponentsV2 });
        }
        return i.reply({ ephemeral: true, content: '✅ Panel atıldı' });
    }

    if(i.isStringSelectMenu() && i.customId === 'select') {
        await i.deferReply({ ephemeral: true });
        const type = i.values[0];
        let cat = type==='general'?CATS.general:type==='internal'?CATS.internal:CATS.highrank;
        let allowed = type==='highrank'?ROLES.hr:[ROLES.staff,...ROLES.hr];
        let tag = type==='highrank'?ROLES.hr.map(id=>`<@&${id}>`).join(' '):`<@&${ROLES.staff}>`;
        let label = type==='general'?'General':type==='internal'?'Internal Affairs':'High Rank';

        const overwrites = [
            { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] }
        ];
        for(const r of allowed) overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });

        const ch = await i.guild.channels.create({
            name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,90),
            type: ChannelType.GuildText,
            parent: cat,
            topic: i.user.id,
            permissionOverwrites: overwrites
        });

        // DÜZELTİLEN KISIM: Normal embed, boş kalmayacak
        const embed = new EmbedBuilder()
           .setColor(0x3B82F6)
           .setTitle(`${label} Ticket`)
           .setDescription(`Hello <@${i.user.id}>, your ticket has been created!\n\nPlease explain your issue in detail and wait for staff.\n\n-# California State Utilities`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        await ch.send({ content: `${i.user} ${tag}`, embeds: [embed], components: [row] });
        return i.editReply({ content: `✅ Ticket açıldı: ${ch}` });
    }

    if(i.isButton() && i.customId === 'close') {
        await i.reply({ content: 'Kanal 3 sn sonra silinecek...' });
        setTimeout(()=> i.channel.delete().catch(()=>{}), 3000);
    }
    if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'close') {
        await i.reply({ content: 'Kapatılıyor...' });
        setTimeout(()=> i.channel.delete().catch(()=>{}), 2000);
    }
});

client.login(process.env.TOKEN);
