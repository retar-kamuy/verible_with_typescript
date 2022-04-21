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

type Dict<T> = {
	[key: string]: T
}

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
const process_file_data = (file_path: string, data: SyntaxData): Dict<ModuleInfo> => {
	const modules_info: Dict<ModuleInfo> = {};

	if (data === undefined)
		return {};
	if (data.tree == undefined)
		return {};

	//console.log(data.tree);
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
		//console.log(header);
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

		const _module_info: Dict<ModuleInfo> = {};
		_module_info[module_info.name] = module_info;
		Object.assign(modules_info, _module_info);
		//modules_info.push(module_info);
	}
	return modules_info;
}

const top_module = (modules_info: Dict<ModuleInfo>): string[] => {
	let _top_module: string[] = [];

	for (const [child_name, child_info] of Object.entries(modules_info)) {
		let parents_name: string[] = [];

		for (const [parent_name, parent_info] of Object.entries(modules_info)) {
			if (child_name !== parent_name) {
				if (parent_info.instances.type.indexOf(child_name) > -1) {
					parents_name.push(parent_name);
				}
			}
		}

		if (parents_name.length === 0) {
			_top_module.push(child_name);
		}
	}
	return _top_module;
}

const hierarchy = (modules_info: Dict<ModuleInfo>, top_modules: string[]): void => {
	top_modules.forEach((top_module: string) => {
		let children_module: string[] = [];
		children_module.unshift(modules_info[top_module].name);
		while (children_module.length !== 0) {
			const module_info = modules_info[children_module[0]];
			children_module.shift();
			if (module_info === undefined) {
				continue;
			}

			console.log(module_info);
			if(module_info.instances !== undefined) {
				children_module = module_info.instances.name.concat(children_module);
			}
		}
	});
}

function main(): void {
	const my_args = process.argv.slice(2);
	//let parser_path = path.join('verible', 'win64', 'verible-verilog-syntax.exe');
	const parser_path = my_args[0];

	//let files = [path.join('dist', 'APB_SPI_Top.v'), path.join('dist', 'APB_SLAVE.v')];
	const files = my_args.slice(1);

	let parser = new VeribleVerilogSyntax(parser_path);
	let data = parser.parse_files(files);

	let modules_info: Dict<ModuleInfo> = {};
	for (const [file_path, file_json] of Object.entries(data)) {
		//modules_info = modules_info.concat(process_file_data(file_path, file_json));
		Object.assign(modules_info, process_file_data(file_path, file_json));
	}
	const top_modules = top_module(modules_info);
	console.log('/** Top Module List ******************************************');
	console.log(top_modules);
	console.log(' */\n');

	console.log('/** Design Hierarchy *****************************************');
	hierarchy(modules_info, top_modules);
	console.log(' */\n');
};

main();
//node dist\extract_module_info.js verible\win64\verible-verilog-syntax.exe dist\APB_SPI_Top.v dist\APB_SLAVE.v
