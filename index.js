const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('CA Bot Alive'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CATS = { general: "1493988237830787155", internal: "1507523007524896888", highrank: "1507522925602013425" };
const ROLES = { staff: "1493988230406733874", hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"] };
let votes = new Set();

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} ONLINE V2 IMG`);
    await client.application.commands.set([
        { name: 'ticket', description: 'Ticket', options: [
            { name: 'setup', description: 'Setup panel', type: 1 },
            { name: 'close', description: 'Close', type: 1 },
            { name: 'closerequest', description: 'Request close', type: 1 },
            { name: 'rename', description: 'Rename', type: 1, options: [{ name: 'name', type: 3, required: true }] },
            { name: 'add', description: 'Add', type: 1, options: [{ name: 'user', type: 6, required: true }] },
            { name: 'remove', description: 'Remove', type: 1, options: [{ name: 'user', type: 6, required: true }] },
        ]},
        { name: 'session', description: 'Session', options: [
            { name: 'full', type: 1 }, { name: 'startup', type: 1, options: [{ name: 'voters', type: 3, required: false }] },
            { name: 'vote', type: 1 }, { name: 'shutdown', type: 1 }
        ]},
        { name: 'claim', description: 'Claim' },
        { name: 'unclaim', description: 'Unclaim' }
    ]);
});

function panelV2() {
    const container = new ContainerBuilder().setAccentColor(0x2B2D31);
    container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://assistance.png')));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## California Roleplay\nWelcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.\n\n**General Support Ticket**\nUse this ticket type for general questions, assistance with features or inquiries about our community rules.\n\n**Internal Affairs Ticket**\n• Staff Reports.\n• Partnership.\n• Questions.\n\n**High Rank Ticket**\n• HR Reports.\n• In-Game Bug Reports.\n• Question For Ownership.\n\n**2026 © California Roleplay.**\nAll rights reserved.`));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('select').setPlaceholder('Select Support Category').addOptions(
            { label: 'General Ticket', value: 'general', emoji: '📩' },
            { label: 'Internal Affairs Ticket', value: 'internal', emoji: '📩' },
            { label: 'High Rank Ticket', value: 'highrank', emoji: '📩' }
        )
    ));
    return container;
}

client.on('interactionCreate', async i => {
    try {
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
            await i.channel.send({ components: [panelV2()], files: [{ attachment: './assistance.png', name: 'assistance.png' }], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: '✅ V2 Panel kuruldu! Foto üstte, dropdown içerde, formsuz' });
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
            const opened = new ContainerBuilder().setAccentColor(0x3B82F6).addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${label.toUpperCase()} TICKET\nHello <@${i.user.id}>, your ticket has been created.\n\nPlease explain your issue and wait for staff.`)).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'), new ButtonBuilder().setCustomId('claim').setLabel('Claim').setStyle(ButtonStyle.Secondary)));
            await ch.send({ content: `${i.user} ${tag}`, components: [opened], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: `✅ ${ch}` });
        }
        if(i.isChatInputCommand() && i.commandName === 'ticket') {
            const sub = i.options.getSubcommand();
            if(sub==='close'){ await i.reply({ content:'Closing...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 2000); }
            if(sub==='closerequest'){ const owner = i.channel.topic?.match(/\d{17,20}/)?.[0]; const cont = new ContainerBuilder().setAccentColor(0x2B2D31).addTextDisplayComponents(new TextDisplayBuilder().setContent(`Hi <@${owner}>, close request...`)).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Continue').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger))); return i.reply({ content:`<@${owner}>`, components:[cont], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='rename'){ await i.channel.setName(i.options.getString('name')); return i.reply({ content:'Renamed', ephemeral:true }); }
            if(sub==='add'){ const u=i.options.getUser('user'); await i.channel.permissionOverwrites.edit(u.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true}); return i.reply(`${u} added`); }
            if(sub==='remove'){ const u=i.options.getUser('user'); await i.channel.permissionOverwrites.delete(u.id); return i.reply(`${u} removed`); }
        }
        if(i.isChatInputCommand() && i.commandName === 'session'){
            const sub=i.options.getSubcommand();
            if(sub==='full'){ const c=new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🟢 Session is Full!\nSince: <t:${Math.floor(Date.now()/1000)}:R>`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='startup'){ votes.clear(); const v=i.options.getString('voters')||''; const c=new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🚀 Session Started!\n${v}`)); return i.reply({ content:'@here', components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(sub==='vote'){ if(votes.has(i.user.id)) return i.reply({ content:'Already voted', ephemeral:true }); votes.add(i.user.id); if(votes.size>=5){ votes.clear(); const c=new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🚀 Session Started! 5/5`)); await i.channel.send({ content:'@here', components:[c], flags:MessageFlags.IsComponentsV2 }); return i.reply({ content:'✅ 5/5 Starting!' }); } else return i.reply({ content:`✅ ${i.user} voted ${votes.size}/5` }); }
            if(sub==='shutdown'){ votes.clear(); const c=new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🔴 Session Shutdown`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
        }
        if(i.isButton() && i.customId==='close'){ await i.reply({ content:'Closing...' }); setTimeout(()=> i.channel.delete().catch(()=>{}), 2000); }
        if(i.isButton() && i.customId==='claim'){ await i.channel.permissionOverwrites.edit(i.user.id,{ViewChannel:true,SendMessages:true}); return i.reply({ content:`Claimed by ${i.user}` }); }
        if(i.isButton() && i.customId==='cancel'){ return i.reply({ content:'Cancelled' }); }
    } catch(e){ console.error(e); if(!i.replied) i.reply({ ephemeral:true, content:'Error: '+e.message }).catch(()=>{}); }
});

client.login(process.env.TOKEN);
