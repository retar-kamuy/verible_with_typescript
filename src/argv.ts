import * as yargs from 'yargs';

const Argv = yargs
	.locale('en')
	.usage('Usage: node ./dist/anaysis_module_info.js -d VERILOG_FILE [VERILOG_FILE] [...]')
	.option({
		dir: {
			alias: 'd',
			description: "Path to Verilog files directories.",
			type: 'string',
			array: true,
			demandOption: true,
		}
	})
	.help()
	.parseSync();

export { Argv };
