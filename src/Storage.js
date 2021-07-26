const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../storage.json');

const exists = () => fs.existsSync(target);

const read = () => new Promise(
	(done, fail) => fs.readFile(
		target,
		(err, res) => err ? fail(err) : done(res),
	),
);

const write = (buffer) => new Promise(
	(done, fail) => fs.writeFile(
		target,
		buffer,
		(err, res) => err ? fail(err) : done(res),
	),
);

const load = async () => {
	if (!exists()) {
		return {};
	}
	const buffer = await read();
	const json = buffer.toString('utf8');
	return JSON.parse(json);
};

const store = async (data) => {
	const json = JSON.stringify(data, null, '\t');
	const buffer = Buffer.from(json, 'utf8');
	await write(buffer);
};

module.exports.val = async (name, value) => {
	const data = await load();
	if (value === undefined) {
		return data[name];
	}
	data[name] = value;
	await store(data);
};
