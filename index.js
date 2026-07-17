const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('CA Bot Live'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CATS = { general: "1493988237830787155", internal: "1507523007524896888", highrank: "1507522925602013425" };
const ROLES = { staff: "1493988230406733874", hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"] };
let votes = new Set();

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} V2 FINAL`);
    await client.application.commands.set([
        { name: 'ticket', description: 'Ticket', options: [
            { name: 'setup', description: 'Setup V2 panel (foto üstte)', type: 1 },
            { name: 'close', type: 1 }, { name: 'closerequest', type: 1 },
            { name: 'rename', type: 1, options: [{ name: 'name', type: 3, required: true }] },
            { name: 'add', type: 1, options: [{ name: 'user', type: 6, required: true }] },
            { name: 'remove', type: 1, options: [{ name: 'user', type: 6, required: true }] },
        ]},
        { name: 'session', options: [
            { name: 'full', type: 1 }, { name: 'startup', type: 1, options: [{ name: 'voters', type: 3, required: false }] },
            { name: 'vote', type: 1 }, { name: 'shutdown', type: 1 }
        ], description: 'Session' }
    ]);
});

function panelV2() {
    const container = new ContainerBuilder().setAccentColor(0x2B2D31);

    // ÜSTTE DEV FOTO - tickets.bot gibi
    container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL('attachment://assistance.png').setDescription('California Assistance')
        )
    );

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
`## California Roleplay
Welcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.

### General Support Ticket
Use this ticket type for general questions, assistance with features or inquiries about our community rules.

### Internal Affairs Ticket
• Staff Reports.
• Partnership.
• Questions.

### High Rank Ticket
• HR Reports.
• In-Game Bug Reports.
• Question For Ownership.

**2026 © California Roleplay.**
All rights reserved.`
    ));

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));

    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('select').setPlaceholder('Select Support Category').addOptions(
            { label: 'General Ticket', value: 'general', emoji: '📩', description: 'General help & questions' },
            { label: 'Internal Affairs Ticket', value: 'internal', emoji: '🛡️', description: 'Staff reports & partnerships' },
            { label: 'High Rank Ticket', value: 'highrank', emoji: '👑', description: 'HR & Ownership' }
        )
    ));
    return container;
}

client.on('interactionCreate', async i => {
    try {
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
            await i.channel.send({ components: [panelV2()], files: [{ attachment: './assistance.png', name: 'assistance.png' }], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: '✅ V2 Fotoğraflı uzun panel atıldı' });
        }
        if(i.isStringSelectMenu() && i.customId === 'select') {
            const type = i.values[0];
            let cat = type==='general'?CATS.general:type==='internal'?CATS.internal:CATS.highrank;
            let allowed = type==='highrank'?ROLES.hr:[ROLES.staff,...ROLES.hr];
            let tag = type==='highrank'?ROLES.hr.map(id=>`<@&${id}>`).join(' '):`<@&${ROLES.staff}>`;
            let label = type==='general'?'General':type==='internal'?'Internal Affairs':'High Rank';
            const overwrites = [{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles] }];
            for(const r of allowed) overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            const ch = await i.guild.channels.create({ name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-'), type: ChannelType.GuildText, parent: cat, topic: i.user.id, permissionOverwrites: overwrites });
            const opened = new ContainerBuilder().setAccentColor(0x3B82F6).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${label.toUpperCase()} TICKET\nHello <@${i.user.id}>, your ticket has been created! Please explain your issue.`)).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'), new ButtonBuilder().setCustomId('claim').setLabel('Claim').setStyle(ButtonStyle.Secondary)));
            await ch.send({ content: `${i.user} ${tag}`, components: [opened], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: `✅ ${ch}` });
        }
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'close'){ await i.reply({ content:'Closing...' }); setTimeout(()=>i.channel.delete().catch(()=>{}),2000); }
        if(i.isButton() && i.customId === 'close'){ await i.reply({ content:'Closing...' }); setTimeout(()=>i.channel.delete().catch(()=>{}),2000); }
        if(i.isButton() && i.customId === 'claim'){ await i.channel.permissionOverwrites.edit(i.user.id,{ViewChannel:true,SendMessages:true}); return i.reply({ content:`Claimed ${i.user}` }); }
        if(i.isChatInputCommand() && i.commandName === 'session'){
            const sub=i.options.getSubcommand();
            if(sub==='full'){ const c=new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🟢 Session is Full!\n<t:${Math.floor(Date.now()/1000)}:R>`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='startup'){ votes.clear(); const v=i.options.getString('voters')||''; const c=new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🚀 Session Started!\n${v}`)); return i.reply({ content:'@here', components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='vote'){ if(votes.has(i.user.id)) return i.reply({ ephemeral:true, content:'Already voted' }); votes.add(i.user.id); if(votes.size>=5){ votes.clear(); return i.reply({ content:'@here ✅ 5/5 Starting!' }); } return i.reply({ content:`✅ ${votes.size}/5` }); }
            if(sub==='shutdown'){ votes.clear(); const c=new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🔴 Shutdown`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
        }
    } catch(e){ console.error(e); if(!i.replied) i.reply({ ephemeral:true, content:'Error '+e.message }).catch(()=>{}); }
});

client.login(process.env.TOKEN);
