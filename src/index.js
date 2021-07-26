require('dotenv').config();
const Discord = require('discord.js');
const MessageContext = require('./MessageContext');
const Storage = require('./Storage');
const { TOKEN, ID, PREFIX } = process.env;

let notificationChannel = null;
let monitoredChannel = null;

const client = new Discord.Client();

async function notify(except) {
	if (!notificationChannel) {
		return;
	}
	const users = (await Storage.val('users'))
		.filter((id) => id != except);
	const message = 'Chega aí ' + users
		.map((id) => `<@!${id}>`)
		.join(', ');
	await notificationChannel.send(message);
}

const commands = {};
commands.ping = async function () {
	this.reply('pong');
};
commands.clear = async function () {
	return this.clearChannel();
};
commands.notifyhere = async function () {
	const channel = this.getChannel();
	notificationChannel = channel;
	await Storage.val('notificationChannelId', channel.id);
	await this.reply(`Ok, I'll notify here now`);
};
commands.add = async function (arg) {
	let id = arg.trim();
	if (/^<@!\d+>$/.test(id)) {
		id = id.match(/\d+/)[0];
	}
	if (!/^\d+$/.test(id)) {
		this.reply('Invalid argumetn');
	}
	const users = await Storage.val('users') ?? [];
	const array = new Set([ ...users, id ]);
	await Storage.val('users', [ ...array ]);
	await this.reply(`<@!${id}> was added`);
};
commands.monitor = async function(arg) {
	const voiceChannel = this.getVoiceChannel();
	if (!voiceChannel) {
		return this.reply(`You're not connected to a voice channel`);
	}
	monitoredChannel = voiceChannel;
	await Storage.val('monitoredChannelId', voiceChannel.id);
	await this.reply(`Monitoring \`${voiceChannel.name}\` now`);
};

async function getChannel(channelId) {
	const channel = await client.channels.cache.get(channelId);
	return channel;
}

async function init() {
	let notificationChannelId = await Storage.val('notificationChannelId');
	if (notificationChannelId) {
		notificationChannel = await getChannel(notificationChannelId);
	}
	let monitoredChannelId = await Storage.val('monitoredChannelId');
	if (monitoredChannelId) {
		monitoredChannel = await getChannel(monitoredChannelId);
	}
}

async function messageHandler(ctx) {
	const parsed = ctx.parse(PREFIX);
	if (!parsed) {
		return;
	}
	if (parsed.command) {
		const command = commands[parsed.command];
		if (!command) {
			return ctx.reply('Unknown command');
		}
		return ctx.call(command, parsed.arg);
	}
}

async function handleVoiceStateUpdate(oldMember, newMember) {
	const newId = newMember.channelID;
	if (!newId) {
		return;
	}
	if (!monitoredChannel) {
		return;
	}
	if (newId != monitoredChannel.id) {
		return;
	}
	if (!notificationChannel) {
		return;
	}
	await notify(newMember.id);
}

client.on('message', (message) => {
	messageHandler(new MessageContext(message))
		.catch(console.error);
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
	handleVoiceStateUpdate(oldMember, newMember)
		.catch(console.error);
});

client.once('ready', async () => {
	try {
		await init();
		console.log('Bot is on-line.');
	} catch(error) {
		console.error(error);
	}
});

console.log('Loggin in...');
client.login(TOKEN);
