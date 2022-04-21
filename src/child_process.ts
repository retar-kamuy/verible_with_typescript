import * as child_process from 'child_process';

/**
 * Runs a command by asynchronous.
 * Console output is buffer type.
 */
function exec(args: string[]): void {
	child_process.exec(args.join(' '), (err, stdout, stderr) => {
		if(err) {
			throw err;
		} else {
			//console.log(`stdout: ${stdout}`);
		}
	});
}

/**
 * Runs a command, waits for it to complete, then returns a
 * CompletedProcess instance.
 */
const execSync = (args: string[]): {stdout: string} => {
	const stdout = child_process.execSync(args.join(' '));
	return {stdout: stdout.toString()};
}

/**
 * Runs a command by asynchronous.
 * Console output is stream type.
 * 
 * Reference URL: {@link https://tcd-theme.com/2021/09/javascript-asyncawait.html}
 */
const spawn = async (cmd: string, options: string[]) => {
	const promise = new Promise((resolve, reject) => {
		const spawn = child_process.spawn(cmd, options);

		spawn.stdout.on('data', (chunk) => {
			//console.log(`stdout: ${chunk.toString()}`);
		});

		spawn.stderr.on(`data`, (chunk) => {
			console.error(chunk.toString());
		});

		spawn.on('close', (code) => {
			console.info(`close: ${code}`);
			resolve(code);
		});
	});
	return await promise;
}

const as_options = (l: string | string[]): string[] => {
	const with_spaces = !Array.isArray(l) ? [l] : l;
	return _remove_spaces(with_spaces);
}

const _remove_spaces = (with_spaces: string[]): string[] => {
	let without_space: string[] = [];
	with_spaces.forEach((v: string) => {
		const p = v.indexOf(' ');
		if(p > -1) {
			without_space.push(v.slice(0, p));
			without_space.push(..._remove_spaces([v.slice(p+1)]));
		} else {
			without_space.push(v);
		}
	});
	return without_space;
}

export { execSync, as_options }
