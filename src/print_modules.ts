import { SyntaxData, VeribleVerilogSyntax } from './verible_verilog_syntax';

interface ModuleInfo {
	header_text: string;
	name: string;
	ports: string[];
	parameters: string[];
	imports: string[];
};

const _ESC_COLOR = (color: string, values: string): string => {
	const _ESC: {[color: string]: string} = {
		default: '\u001b[0m',
		yellow: '\u001b[33m',
		light_black: '\u001b[90m',
		light_green: '\u001b[92m',
		light_yellow: '\u001b[93m',
		light_white: '\u001b[97m'
	};

	return `${_ESC[color]}${values}${_ESC.default}`;
};

function print_entry(key: string, values: string[]): void {
	const fmt_values: string[] = [];
	for (const v of values) {
		fmt_values.push(_ESC_COLOR('light_green', v));
	}

	let value_part: string = '';
	if (fmt_values.length !== 0) {
		for (const v of fmt_values) {
			value_part += _ESC_COLOR('yellow', '\n' + ' '.repeat(key.length) + v + '\n');
		}
	}
	else {
		value_part = _ESC_COLOR('light_black', '-');
	}
	console.info(`${_ESC_COLOR('yellow', '//')}${key}${value_part}`);
};

function process_file_data(path: string, data: SyntaxData): void {
	const modules_info: ModuleInfo[] = [];

	if (data.tree !== undefined) {
		//console.debug(data.tree);
		for (const module of data.tree.iter_find_all({'tag': 'kModuleDeclaration'})) {
			const module_info: ModuleInfo = {
				header_text: '',
				name: '',
				ports: [],
				parameters: [],
				imports: []
			};

			// Find module header
			const header = module.find({'tag': 'kModuleHeader'});
			if (header === undefined) {
				continue;
			}
			//module_info.header_text = header.text()};

			// Find module name
			const name = header.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
			if (name === undefined) {
				continue;
			}
			module_info.name = name.text();
			//console.debug(module_info.name);

			// Get the list of ports
			for (const port of header.iter_find_all({'tag': ['kPortDeclaration', 'kPort']})) {
				const port_id = port.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
				module_info.ports.push(port_id.text());
				//console.debug(module_info.ports);
			}

			// Get the list of parameters
			for (const param of header.iter_find_all({"tag": ["kParamDeclaration"]})) {
				const param_id = param.find({"tag": ["SymbolIdentifier", "EscapedIdentifier"]});
				module_info.parameters.push(param_id.text());
				//console.debug(module_info.parameters);
			}

			// Get the list of imports
			for (const pkg of module.iter_find_all({"tag": ["kPackageImportItem"]})) {
				module_info.imports.push(pkg.text());
				//console.debug(module_info.imports);
			}
			modules_info.push(module_info);
		}

		// Print results
		if (modules_info.length > 0) {
			console.info(`\u001b[1;97;7m${path} \u001b[0m\n`);
		}

		for (const module_info of modules_info) {
			print_entry("name:       ", [module_info.name]);
			print_entry("ports:      ", module_info.ports);
			print_entry("parameters: ", module_info.parameters);
			print_entry("imports:    ", module_info.imports);
		}
	}
}

function main(): void {
	let parser_path = ['\.\.\\verible', 'win64', 'verible-verilog-syntax.exe'];
	let files = ['\.\\APB_SPI_Top.v'];

	let parser = new VeribleVerilogSyntax(parser_path.join('\\'));
	let data = parser.parse_files(files);

	for (const [file_path, file_json] of Object.entries(data)) {
		process_file_data(file_path, file_json);
	}
};

main();
