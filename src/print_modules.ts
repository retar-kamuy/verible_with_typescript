import { Node, SyntaxData, BranchNode, VeribleVerilogSyntax } from './verible_verilog_syntax';

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
	console.log(`${_ESC_COLOR('yellow', '//')}${key}${value_part}`);
};

function process_file_data(path: string, data: SyntaxData): void {
	if (data.tree !== undefined) {
		console.log(data.tree);
		for (const module of data.tree.iter_find_all({'tag': 'kModuleDeclaration'})) {
			const header = module.find({'tag': 'kModuleHeader'});
			console.log(header);
			const name = header.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
			console.log(name);
			console.log(name.text());

			for (const port of header.iter_find_all({'tag': ['kPortDeclaration', 'kPort']})) {
				const port_id = port.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
				console.log(port_id.text());
			}
		}
	}
}

function main(): void {
	let parser_path = '\.\\verible-verilog-syntax.exe';
	let files = ['\.\\APB_SPI_Top.v'];

	let parser = new VeribleVerilogSyntax(parser_path);
	let data = parser.parse_files(files);

	for (const [file_path, file_json] of Object.entries(data)) {
		process_file_data(file_path, file_json);
	}
	//console.log(data);
	//console.log(data.source_code);
	//console.log(module[0]);
	//const header = module[0].find(['kModuleHeader']);
	//console.log(header.children);
	//const name = header.children[0].find(['SymbolIdentifier', 'EscapedIdentifier']);
	//console.log(name);
	//print_entry('name:       ', [name.text]);
	//console.log(name.text);

	//const port = branch_node.iter_find_all(header, ['kPortDeclaration', 'kPort']);
	//console.log(port);
	//const port_id = branch_node.find_all(port, ['SymbolIdentifier', 'EscapedIdentifier']);
	//console.log(port_id);
};

main();
