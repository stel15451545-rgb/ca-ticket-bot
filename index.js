const http = require('http');
http.createServer((req,res)=>{ res.writeHead(200); res.end('OK'); }).listen(process.env.PORT || 10000);

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1493988229734162572'; // sunucu id

client.once('clientReady', async () => {
  console.log(`✅ ${client.user.tag} READY - LOGIN SUCCESS`);
  const guild = await client.guilds.fetch(GUILD_ID).catch(e=>console.log('Guild fetch fail', e.message));
  if(guild){
    await guild.commands.set([{ name: 'ping', description: 'test' }]);
    console.log('✅ /ping yüklendi');
  }
});

client.on('interactionCreate', async i => {
  console.log('INTERACTION GELDI:', i.commandName);
  if(i.commandName === 'ping'){
    await i.reply({ content: 'Bot çalışıyor kanka ✅', ephemeral: true });
  }
});

client.login(process.env.TOKEN)
  .then(()=>console.log('Login denendi'))
  .catch(e=>console.error('LOGIN FAILED:', e));
