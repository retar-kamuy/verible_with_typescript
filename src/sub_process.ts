import * as child_process from 'child_process';

//type _CMD = string[];

/**
 * ``subprocess`` wrapper of Python module.
 *
 * ``subprocess`` allows you to spawn process, connect to their
 * input/output/error pipes, and obtain their return codes.
 *
 * For a complete description of this module see the Python documentation.
 */
export class SubProcess {
	/**
	 * Runs a command by asynchronous.
	 * Console output is buffer type.
	 */
	run(args: string[]): void {
		child_process.exec(args.join(' '), (err, stdout, stderr) => {
			if(err) {
				console.error(`stderr: ${stderr}`);
				throw err;
			} else {
				console.info(`stdout: ${stdout}`);
			}
		});
	}

	/**
	 * Runs a command, waits for it to complete, then returns a
	 * CompletedProcess instance.
	 */
	runSync = (args: string[]): {stdout: string} => {
		const stdout = child_process.execSync(args.join(' '));
		console.info(`stdout: ${stdout.toString()}`);
		return {stdout: stdout.toString()};
	}

	/**
	 * Runs a command by asynchronous.
	 * Console output is stream type.
	 * 
	 * Reference URL: {@link https://tcd-theme.com/2021/09/javascript-asyncawait.html}
	 */
	async spawn(cmd: string, options: string[]) {
		const promise = new Promise((resolve, reject) => {
			const spawn = child_process.spawn(cmd, options);

			spawn.stdout.on('data', (chunk) => {
				console.info(`stdout: ${chunk.toString()}`);
			});

			spawn.stderr.on(`data`, (chunk) => {
				console.error(`stderr: ${chunk.toString()}`);
			});

			spawn.on('close', (code) => {
				console.info(`close: ${code}`);

				resolve(code);
			});
		});
		return await promise;
	}

	as_options = (l: string | string[]): string[] => {
		const with_spaces = !Array.isArray(l) ? [l] : l;
		return this._remove_spaces(with_spaces);
	}

	_remove_spaces = (with_spaces: string[]): string[] => {
		let without_space: string[] = [];
		for (const v of with_spaces) {
			const p = v.indexOf(' ');
			if(p > -1) {
				without_space.push(v.slice(0, p));
				without_space.push(...this._remove_spaces([v.slice(p+1)]));
			} else {
				without_space.push(v);
			}
		}
		return without_space;
	}

}
