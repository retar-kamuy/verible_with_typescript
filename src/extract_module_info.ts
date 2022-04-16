/**
 * Copyright 2022 Takumi Hoshi.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This code is translated the JSON export sample in Python into TypeScript.
 * the sample is created by the Verible Authors.
*/

import { SyntaxData, VeribleVerilogSyntax } from './verible_verilog_syntax';

type InstanceInfo = {
	name: string;
	type: string;
}

interface ModuleInfo {
	path: string;
	name: string;
	ports: string[];
	parameters: string[];
	imports: string[];
	instances: InstanceInfo[];
};

/**
 * Print information about modules found in SystemVerilog file.
 *
 * This function uses verible_verilog_syntax.Node methods to find module
 * declarations and specific tokens containing following information:
 *
 * * module file path
 * * module name
 * * module port names
 * * module parameter names
 * * module imports
 * * module instances names and types
 *
 * Args:
 *   path: Path to source file (used only for informational purposes)
 *   data: Parsing results returned by one of VeribleVerilogSyntax' parse_*
 *         methods.
 */
function process_file_data(file_path: string, data: SyntaxData): void {
	const modules_info: ModuleInfo[] = [];

	if (data === undefined) {
		return;
	}
	if (data.tree == undefined) {
		return;
	}
	for (const module of data.tree.iter_find_all({'tag': 'kModuleDeclaration'})) {
		const module_info: ModuleInfo = {
			path: '',
			name: '',
			ports: [],
			parameters: [],
			imports: [],
			instances: []
		};

		module_info.path = file_path;

		// Find module header
		const header = module.find({'tag': 'kModuleHeader'});
		if (header === undefined) {
			continue;
		}

		// Find module name
		const name = header.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
		if (name === undefined) {
			continue;
		}
		module_info.name = name.text();

		// Get the list of ports
		for (const port of header.iter_find_all({'tag': ['kPortDeclaration', 'kPort']})) {
			const port_id = port.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
			module_info.ports.push(port_id.text());
		}

		// Get the list of parameters
		for (const param of header.iter_find_all({'tag': ['kParamDeclaration']})) {
			const param_id = param.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
			module_info.parameters.push(param_id.text());
		}

		// Get the list of imports
		for (const pkg of module.iter_find_all({'tag': ['kPackageImportItem']})) {
			module_info.imports.push(pkg.text());
		}

		// Get the list of instances
		const names: string[] = [];
		for (const inst of module.iter_find_all({'tag': ['kGateInstance']})) {
			const inst_id = inst.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
			names.push(inst_id.text());
		}
		for (const type of module.iter_find_all({'tag': ['kInstantiationType']})) {
			const type_id = type.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
			module_info.instances.push({name: names[0], type: type_id.text()});
			names.shift();
		}

		modules_info.push(module_info);
	}

	modules_info.forEach((module_info: ModuleInfo) => {
		console.info(module_info.path);
		console.info(module_info.name);
		console.info(module_info.ports);
		console.info(module_info.parameters);
		console.info(module_info.imports);
		console.info(module_info.instances);
	});
	//console.log(modules_info);
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
