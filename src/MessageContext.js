class MessageContext {
	constructor(message) {
		this.message = message;
	}
	getMessageText() {
		return this.message.content;
	}
	parse(prefix) {
		const text = this.getMessageText();
		if (!text.startsWith(prefix)) {
			return null;
		}
		const match = text
			.substr(prefix.length)
			.match(/(?<command>\w+)(\s+)?(?<arg>.*)$/);
		const { command, arg = '' } = match?.groups ?? {};
		if (!command) {
			return null;
		}
		return { command, arg };
	}
	async reply(text) {
		await this.message.reply(text);
		return this;
	}
	async clearChannel() {
		const { channel } = this.message;
		const messages = await channel.messages.fetch();
		for (let [, message] of messages) {
			await message.delete();
		};
	}
	getVoiceChannel () {
		return this.message.member.voice.channel;
	}
	getChannel() {
		return this.message.channel;
	}
	call(fn, arg) {
		return fn.call(this, arg);
	}
}

module.exports = MessageContext;
