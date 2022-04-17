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
 * This code is translated Verible's SystemVerilog Syntax tool in Python into TypeScript.
 * the tool is obtained the Apache License, Version 2.0;
 *
 * Verible's repository at:
 *     https://github.com/chipsalliance/verible
*/

import path from 'path';
import { SyntaxData, VeribleVerilogSyntax } from './verible_verilog_syntax';

interface ModuleInfo {
	path: string;
	name: string;
	ports: string[];
	parameters: string[];
	imports: string[];
	instances: {
		name: string[],
		type: string[]
	};
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
 * @param path Path to source file (used only for informational purposes)
 * @param data Parsing results returned by one of VeribleVerilogSyntax' parse_* methods.
 */
const process_file_data = (file_path: string, data: SyntaxData): ModuleInfo[] => {
	const modules_info: ModuleInfo[] = [];

	if (data === undefined)
		return modules_info;
	if (data.tree == undefined)
		return modules_info;

	//console.info(data.tree);
	for (const module of data.tree.iter_find_all({'tag': 'kModuleDeclaration'})) {
		const module_info: ModuleInfo = {
			path: '',
			name: '',
			ports: [],
			parameters: [],
			imports: [],
			instances: {name: [], type: []}
		};

		module_info.path = file_path;

		// Find module header
		const header = module.find({'tag': 'kModuleHeader'});
		//console.info(header);
		if (header === undefined)
			continue;

		// Find module name
		const name = header.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
		if (name === undefined)
			continue;
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
		module_info.instances = {name: [], type: []};
		for (const inst of module.iter_find_all({'tag': ['kGateInstance']})) {
			const inst_id = inst.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
			if(inst_id === undefined)
				continue;
			module_info.instances.name.push(inst_id.text());
		}
		for (const type of module.iter_find_all({'tag': ['kInstantiationType']})) {
			const type_id = type.find({'tag': ['SymbolIdentifier', 'EscapedIdentifier']});
			if(type_id === undefined)
				continue;
			module_info.instances.type.push(type_id.text());
		}

		modules_info.push(module_info);
	}
	return modules_info;
}

const top_module = (modules_info: ModuleInfo[]): string[] => {
	return modules_info.reduce((top_module: string[], child: ModuleInfo) => {
		const parents_module = modules_info.reduce((parents: string[], parent: ModuleInfo) => {
			if ((child.name !== parent.name)) {
				if (parent.instances.type.indexOf(child.name) > -1)
					parents.push(parent.name);
			}
			return parents;
		}, []);

		if (parents_module.length === 0) {
			top_module.push(child.name);
		}
		return top_module;
	}, []);
}

function main(): void {
	let parser_path = path.join('verible', 'win64', 'verible-verilog-syntax.exe');
	let files = [path.join('dist', 'APB_SPI_Top.v'), path.join('dist', 'APB_SLAVE.v')];

	let parser = new VeribleVerilogSyntax(parser_path);
	let data = parser.parse_files(files);

	let modules_info: ModuleInfo[] = [];
	for (const [file_path, file_json] of Object.entries(data)) {
		modules_info = modules_info.concat(process_file_data(file_path, file_json));
	}
	const top_modules = top_module(modules_info);
	console.info(top_modules);
};

main();
