import { BranchNode, VeribleVerilogSyntax } from './verible_verilog_syntax';

const main = (): void => {
	let parser_path = '\.\\verible-verilog-syntax.exe';
	let files = ['\.\\APB_SPI_Top.v'];

	let parser = new VeribleVerilogSyntax(parser_path);
	let data = parser.parse_files(files);

	const branch_node = new BranchNode();
	const module = branch_node.iter_find_all(data, ['kModuleDeclaration']);
	console.log(module);
	const header = branch_node.find(data, ['kModuleHeader']);
	const port = branch_node.iter_find_all(header, ['kPortDeclaration', 'kPort']);
	console.log(port);
	const port_id = branch_node.find(port, ['SymbolIdentifier', 'EscapedIdentifier']);
	console.log(port_id);
};

main();
