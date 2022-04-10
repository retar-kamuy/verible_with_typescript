
import console from 'console';
import { FileIO } from './file_io';
import { SubProcess } from './sub_process';
import Dig from './dig';

type Dict<T> = {
	[key: string]: T
}

export interface SyntaxData {
	source_code?: string;
	tree?: RootNode;
	//tokens: Token[];
	//rawtokens: Token[];
	//errors: Error[];
}

/**
 * Base VeribleVerilogSyntax syntax tree node.
 *
 * Attributes:
 *  parent (Optional[Node]): Parent node.
 */
export class Node {
	public parent: Node | undefined;

	constructor(parent?: Node) {
		parent !== undefined ? this.parent = parent : this.parent = undefined;
	}

	/**
	 * Parent SyntaxData.
	 */
	syntax_data(): any {
		console.log('syntax_data');
		console.log(this.parent);
		if(this.parent !== undefined) {
			return this.parent.syntax_data() !== undefined
			? this.parent
			: undefined;
		}
	}

	/**
	 * Byte offset of node's first character in source text.
	 */
	 start(): number | undefined {
		return undefined;
	}

	/**
	 * Byte offset of a character just past the node in source text.
	 */
	end(): number | undefined {
		return undefined;
	}

	/**
	 * Source code fragment spanning all tokens in a node.
	 */
	text(): string {
		const start = this.start();
		const end = this.end();
		const sd = this.syntax_data();
		return '';
	}
}

/**
 * Syntax tree branch node
 *
 * Attributes:
 * @param tag (str): Node tag.
 * @param children (Optional[Node]): Child nodes.
 */
export class BranchNode extends Node {
	private tag: string;
	private children: Node[] | undefined;

	constructor(tag: string, parent?: Node, children?: Node[]) {
		super(parent);
		this.tag = tag;
		children !== undefined ? this.children = children : this.children = [];
	}

	//start(): number {
		//const first_token = this.find(lambda n: isinstance(n, TokenNode),
	    //                       iter_=PostOrderTreeIterator)
	    //return first_token.start if first_token else None
	//}

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
	iter_find_all(filter_: {[key: string]: string[]}, max_count?: number): BranchNode[] {
		const dig = new Dig(max_count);
		for (const target of filter_.tag) {
			dig.run(this.children, target);
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
	find(filter_: {[key: string]: string[]}): BranchNode {
		const nodes = this.iter_find_all(filter_, 1);
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
	find_all(filter_: {[key: string]: string[]}, max_count?: number): BranchNode[] {
		return this.iter_find_all(filter_, max_count);
	}
}

/**
 * Syntax tree root node.
 */
class RootNode extends BranchNode {
	private _syntax_data: SyntaxData | undefined;

	constructor(tag: string, syntax_data?: SyntaxData, children?: Node[]) {
		super(tag, undefined, children);
		this._syntax_data = syntax_data;
	}

	syntax_data(): SyntaxData | undefined {
		return this._syntax_data;
	}
}

/**
 * Syntax tree leaf node.
 *
 * This specific class is used for null nodes.
 */
class LeafNode extends Node {
	/**
	 * Byte offset of token's first character in source text.
	 */
	start(): number | undefined {
		return undefined;
	}

	/**
	 * Byte offset of a character just past the token in source text.
	 */
	end(): number | undefined {
		return undefined;
	}
}

/**
 * Tree node with token data
 *
 * Represents single token in a syntax tree.
 *
 * Attributes:
 *   tag (str): Token tag.
 */
class TokenNode extends LeafNode {
	private tag: string;
	private _start: number;
	private _end: number;

	constructor(tag: string, _start: number, _end: number, parent?: Node) {
		super(parent);
		this.tag = tag;
		this._start = _start;
		this._end = _end;
	}

	start(): number {
		return this._start;
	}

	end(): number {
		return this._end;
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

	_transform_tree(tree: any, data: SyntaxData, skip_null: boolean): RootNode {
		const children = [];
		const tag = tree.tag;
		if (!('children' in tree)) {
			return new RootNode(tag, data, []);
		}

		//console.log(tree);
		for (const child of tree.children) {
			!((skip_null && child === null) || child === undefined)
			? children.push(this.transform(child, skip_null))
			: children.push(new LeafNode());
		}

		//console.log(tree);
		return new RootNode(tag, data, children);
	}

	transform(tree: any, skip_null: boolean): any {
		if (tree === undefined) {
			return undefined;
		}
		if ('children' in tree) {
			const children = [];
			for (const child of tree.children) {
				!((skip_null && child === null) || child === undefined)
				? children.push(this.transform(child, skip_null))
				: children.push(new LeafNode());
			}
			let tag = tree.tag;
			return new BranchNode(tag, undefined, children);
		}
		const tag = tree.tag;
		const start = tree.start;
		const end = tree.end;
		return new TokenNode(tag, start, end)
	}

	/**
	 * Common implementation of parse_* methods
	 */
	_parse(paths: string[], options?: Dict<any>, input_?: string): Dict<SyntaxData> {
		const _options = {
			gen_tree: true,
			skip_null: true,
			gen_tokens: false,
			gen_rawtokens: false,
			options
		};

		var args = ['-export_json'];
		if (_options.gen_tree) {
			args.push('-printtree');
		}
		if (_options.gen_tokens) {
			args.push('-printtokens');
		}
		if (_options.gen_rawtokens) {
			args.push('-printrawtokens');
		}

		const subprocess = new SubProcess();
		const proc = subprocess.run([this.executable, ...args, ...paths]);

		const json_data: SyntaxData = JSON.parse(proc.stdout);
		let data: Dict<SyntaxData> = {};

		for (const [file_path, file_json] of Object.entries(json_data)) {
			//console.log(`{${file_path}, ${file_json}}`);
			let file_data: SyntaxData;

			if (file_path === '-') {
				file_data = {source_code: input_};
			}
			else {
				const f = new FileIO();
				file_data = {source_code: f.readFileSync(file_path)};
			}

			if ('tree' in file_json) {
				//file_data.tree = file_json_.tree;
				file_data.tree = this._transform_tree(file_json.tree, file_data, _options.skip_null);
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
