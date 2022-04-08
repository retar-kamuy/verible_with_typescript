import { exec, execSync } from 'child_process';

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
	 */
	runAsync(args: string[]): {stdout: string} {
		let stdout_ = '';
		exec(args.join(' '), (err, stdout, stderr) => {
			if(err) {
				console.log(`stderr: ${stderr}`);
				throw err;
			}
			//console.log(`stdout: ${stdout}`);
			stdout_ = stdout;
		});
		console.log(`stdout: ${stdout_}`);
		return {stdout: stdout_};
	}

	/**
	 * Runs a command, waits for it to complete, then returns a
	 * CompletedProcess instance.
	 */
	run(args: string[]): {stdout: string} {
		let stdout_ = execSync(args.join(' '));
		//console.log(`stdout: ${stdout_.toString()}`);
		return {stdout: stdout_.toString()};
	}
}
