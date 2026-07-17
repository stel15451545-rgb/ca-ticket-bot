const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200, {'Content-Type': 'text/plain'}); res.end('CA Bot Live'); }).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CATS = { general: "1493988237830787155", internal: "1507523007524896888", highrank: "1507522925602013425" };
const ROLES = { staff: "1493988230406733874", hr: ["1516842866255724554", "1507497692312506448", "1507864277023985765"] };
let votes = new Set();

client.once('ready', async () => {
    console.log(`✅ ONLINE ${client.user.tag}`);
    try {
        await client.application.commands.set([
            { name: 'ticket', description: 'Ticket', options: [
                { name: 'setup', description: 'Setup panel', type: 1 },
                { name: 'close', description: 'Close', type: 1 },
                { name: 'rename', description: 'Rename', type: 1, options: [{ name: 'name', type: 3, required: true }] }
            ]},
            { name: 'session', description: 'Session', options: [
                { name: 'full', type: 1, description: 'Full' },
                { name: 'startup', type: 1, description: 'Startup', options: [{ name: 'text', type: 3, required: false }] },
                { name: 'vote', type: 1, description: 'Vote' },
                { name: 'shutdown', type: 1, description: 'Shutdown' }
            ]}
        ]);
        console.log('✅ Commands registered');
    } catch(e){ console.error('Command error', e); }
});

function panel() {
    const c = new ContainerBuilder().setAccentColor(0x2B2D31);
    // DOSYA YOK, sadece yazı - bu yüzden crash yapmaz
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ASSISTANCE\n## California Roleplay\nWelcome to Assistance section. Here you will be able to open a simple ticket of your choice to be directed towards what you desire or have internal issues. Make sure you have proof if your reporting staff members mis-leading into fake reports will get you permanently banned.\n\n**General Support Ticket**\nUse this ticket type for general questions, assistance with features or inquiries about our community rules.\n\n**Internal Affairs Ticket**\n• Staff Reports.\n• Partnership.\n• Questions.\n\n**High Rank Ticket**\n• HR Reports.\n• In-Game Bug Reports.\n• Question For Ownership.\n\n**2026 © California Roleplay.**`));
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
    try {
        if(i.isChatInputCommand() && i.commandName === 'ticket' && i.options.getSubcommand() === 'setup') {
            await i.channel.send({ components: [panel()], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: '✅ V2 Panel kuruldu (formsuz, dosyasız - crash yapmaz)' });
        }
        if(i.isStringSelectMenu() && i.customId === 'select') {
            const type = i.values[0];
            let cat = type==='general'?CATS.general:type==='internal'?CATS.internal:CATS.highrank;
            let allowed = type==='highrank'?ROLES.hr:[ROLES.staff,...ROLES.hr];
            let tag = type==='highrank'?ROLES.hr.map(id=>`<@&${id}>`).join(' '):`<@&${ROLES.staff}>`;
            const overwrites = [{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }];
            for(const r of allowed) overwrites.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            const ch = await i.guild.channels.create({ name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'-'), type: ChannelType.GuildText, parent: cat, topic: i.user.id, permissionOverwrites: overwrites });
            const opened = new ContainerBuilder().setAccentColor(0x3B82F6).addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${type.toUpperCase()} TICKET\nHello <@${i.user.id}>`)).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Close').setStyle(ButtonStyle.Danger)));
            await ch.send({ content: `${i.user} ${tag}`, components: [opened], flags: MessageFlags.IsComponentsV2 });
            return i.reply({ ephemeral: true, content: `✅ ${ch}` });
        }
        if(i.isButton() && i.customId === 'close') { await i.reply({ content: 'Closing...' }); setTimeout(()=>i.channel.delete().catch(()=>{}),1500); }
        if(i.isChatInputCommand() && i.commandName === 'session') {
            const s = i.options.getSubcommand();
            if(s==='full'){ const c=new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🟢 Session Full!`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(s==='startup'){ votes.clear(); const t=i.options.getString('text')||''; const c=new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🚀 Session Started!\n${t}`)); return i.reply({ content:'@here', components:[c], flags:MessageFlags.IsComponentsV2 }); }
            if(s==='vote'){ if(votes.has(i.user.id)) return i.reply({ ephemeral:true, content:'Zaten oy verdin' }); votes.add(i.user.id); if(votes.size>=5){ votes.clear(); return i.channel.send({ content:'@here ✅ 5/5' }).then(()=>i.reply({ content:'5/5!' })); } return i.reply({ content:`✅ ${votes.size}/5` }); }
            if(s==='shutdown'){ votes.clear(); const c=new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🔴 Shutdown`)); return i.reply({ components:[c], flags:MessageFlags.IsComponentsV2 }); }
        }
    } catch(e){ console.error('Interaction error', e); if(!i.replied) try{ await i.reply({ ephemeral:true, content:'Error: '+e.message }); }catch{} }
});

client.login(process.env.TOKEN).catch(e=>{ console.error('Login failed', e); process.exit(1); });
