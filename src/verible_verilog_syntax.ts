
import console from 'console';
import { FileIO } from './file_io';
import { SubProcess } from './sub_process';
import Dig from './dig';

type Dict<T> = {
	[key: string]: T
}

type SyntaxData = {
	source_code?: string
	tree?: {},
	//tokens: Token[],
	//rawtokens: Token[],
	//errors: Error[]
}

/**
 * Syntax tree branch node
 *
 * Attributes:
 * @param tag (str): Node tag.
 * @param children (Optional[Node]): Child nodes.
 */
export class BranchNode {
	/**
	 * Iterate all nodes matching specified filter.
	 *
	 * @param iter_ Tree iterator. Decides in what order nodes are visited.
	 * @param filter_ Describes what to search for. Might be:
	 *     * Callable taking Node as an argument and returning True for accepted
	 *       nodes.
	 *     * Dict mapping Node attribute names to searched value or list of
	 *       searched values.
	 * @param max_count Stop searching after finding that many matching nodes.
	 *
	 * @return Nodes matching specified filter.
	 */
	iter_find_all(iter_: Dict<SyntaxData>, filter_: string[], max_count?: number): any {
		const dig = new Dig(max_count);
		for (const target of filter_) {
			dig.run(iter_, target);
		}
		return dig.get_result();
	}

	/**
	 * Find node matching specified filter.
	 *
	 * @param iter_ Tree iterator. Decides in what order nodes are visited.
	 * @param filter_ Describes what to search for. Might be:
	 *     * Callable taking Node as an argument and returning True for accepted
	 *       node.
	 *     * Dict mapping Node attribute names to searched value or list of
	 *       searched values.
	 *
	 * @return First Node matching filter.
	 */
	find(iter_: any, filter_: string[]): any {
		const nodes = this.iter_find_all(iter_, filter_, 1);
		return nodes[0];
	}

	/**
	 * Find all nodes matching specified filter.
	 *
	 * @param iter_ Tree iterator. Decides in what order nodes are visited.
	 * @param filter_ Describes what to search for. Might be:
	 *    * Callable taking Node as an argument and returning True for accepted
	 *      nodes.
	 *    * Dict mapping Node attribute names to searched value or list of
	 *      searched values.
	 * @param max_count Stop searching after finding that many matching nodes.
	 *
	 * @return List of nodes matching specified filter.
	 */
	find_all(iter_: any, filter_: string[], max_count?: number): any {
		return this.iter_find_all(iter_, filter_, max_count);
	}
}

/**
 * ``verible-verilog-syntax`` wrapper.
 *
 * This class provides methods for running ``verible-verilog-syntax`` and
 * transforming its output into Python data structures.
 *
 */
export class VeribleVerilogSyntax {
	private executable = 'verible-verilog-syntax';

	/**
	 * @param executable path to ``verible-verilog-syntax`` binary.
	 */
	constructor(executable: string) {
		this.executable = executable;
	}

	/** Common implementation of parse_* methods */
	_parse(paths: string[], options?: Dict<any>, input_?: string): Dict<SyntaxData> {
		let _options = {
			'gen_tree': true,
			'skip_null': false,
			'gen_tokens': false,
			'gen_rawtokens': false,
			options
		};

		var args = ['-export_json'];
		if (_options['gen_tree']) {
			args.push('-printtree');
		}
		if (_options['gen_tokens']) {
			args.push('-printtokens');
		}
		if (_options['gen_rawtokens']) {
			args.push('-printrawtokens');
		}

		const subprocess = new SubProcess();
		const proc = subprocess.run([this.executable, ...args, ...paths]);

		const json_data = JSON.parse(proc.stdout);
		let data: Dict<SyntaxData> = {};

		for (const [file_path, file_json] of Object.entries(json_data)) {
			console.log(`{${file_path}, ${file_json}}`);
			let file_data: SyntaxData;

			if (file_path === '-') {
				file_data = {source_code: input_};
			}
			else {
				const f = new FileIO();
				file_data = {source_code: f.readFileSync(file_path)};
			}

			if(typeof file_json === 'object' && file_json !== null) {
				const file_json_: SyntaxData = file_json;

				if ('tree' in file_json_) {
					file_data.tree = file_json_['tree'];
					//file_data.tree = VeribleVerilogSyntax._transform_tree(
					//	file_json["tree"], file_data, options["skip_null"]);
				}

				/**
				 * TODO: Not implemented
				 * if ('tokens' in file_json) {
				 * 	file_data.tokens = file_json_['tokens'];
				 * 	//file_data.tokens = VeribleVerilogSyntax._transform_tokens(
				 * 	//	file_json["tokens"], file_data);
				 * }
				 * 
				 * if ('rawtokens' in file_json) {
				 * 	file_data.rawtokens = file_json_['rawtokens'];
				 * 	//file_data.rawtokens = VeribleVerilogSyntax._transform_tokens(
				 * 	//	file_json["rawtokens"], file_data);
				 * }
				 * 
				 * if ('errors' in file_json) {
				 * 	file_data.errors = file_json_['errors'];
				 * 	//file_data.errors = VeribleVerilogSyntax._transform_errors(
				 * 	//	file_json["errors"]);
				 * }
				 */
			}

			let _data: Dict<SyntaxData> = {file_path: file_data};
			Object.assign(data, _data);
		}
		return data;
		//return json_data;
	}

	/**
	 * Parse multiple SystemVerilog files.
	 * @param paths list of paths to files to parse.
	 * @param options dict with parsing options.
	 * Available options:
	 * ``gen_tree`` (boolean): whether to generate syntax tree.
	 * ``skip_null`` (boolean): null nodes won't be stored in a tree if True.
	 * ``gen_tokens`` (boolean): whether to generate tokens list.
	 * ``gen_rawtokens`` (boolean): whether to generate raw token list.
	 * By default only ``gen_tree`` is True.
	 * @return A dict that maps file names to their parsing results in SyntaxData object.
	 */
	parse_files(paths: string[], options?: Dict<any>): Dict<SyntaxData> {
		return this._parse(paths, options);
	}

	/**
	 * Parse single SystemVerilog file.
	 * @param path path to a file to parse.
	 * @param options dict with parsing options.
	 * Available options:
	 * ``gen_tree`` (boolean): whether to generate syntax tree.
	 * ``skip_null`` (boolean): null nodes won't be stored in a tree if True.
	 * ``gen_tokens`` (boolean): whether to generate tokens list.
	 * ``gen_rawtokens`` (boolean): whether to generate raw token list.
	 * By default only ``gen_tree`` is True.
	 * @return Parsing results in SyntaxData object.
	 */
	parse_file(path: string, options?: Dict<any>): Dict<SyntaxData> {
		return this._parse([path], options);
	}

	/**
	 * Parse a string with SystemVerilog code.
	 * @param str SystemVerilog code to parse.
	 * @param options dict with parsing options.
	 * Available options:
	 * ``gen_tree`` (boolean): whether to generate syntax tree.
	 * ``skip_null`` (boolean): null nodes won't be stored in a tree if True.
	 * ``gen_tokens`` (boolean): whether to generate tokens list.
	 * ``gen_rawtokens`` (boolean): whether to generate raw token list.
	 * By default only ``gen_tree`` is True.
	 * @return Parsing results in SyntaxData object.
	 */
	parse_string(str: string, options?: Dict<any>): Dict<SyntaxData> {
		return this._parse(['-'], options, str);
	}
}
