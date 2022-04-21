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

/** Wrapper for ``verible-verilog-syntax --export_json */
import { readFileSync } from './fs';
import { execSync } from './child_process';
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
		this.parent = parent !== undefined ? parent : undefined;
	}

	/**  Parent SyntaxData. */
	//syntax_data(): SyntaxData | undefined {
	//	if(this.parent !== undefined)
	//		return this.parent.syntax_data() !== undefined ? this.parent : undefined;
	//}
	syntax_data(): string | undefined {
		return undefined;
	}

	/** Byte offset of node's first character in source text. */
	 start(): number | undefined {
		return undefined;
	}

	/** Byte offset of a character just past the node in source text. */
	end(): number | undefined {
		return undefined;
	}

	/** Source code fragment spanning all tokens in a node. */
	text(): string {
		const start = this.start();
		const end = this.end();
		const sd = this.syntax_data();
		//if ((start !== undefined) && (end !== undefined) && sd && sd.source_code && end <= sd.source_code.length)
		//	return sd.source_code.slice(start, end);
		if ((start !== undefined) && (end !== undefined) && (sd !== undefined))
			return sd;
		else
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
		this.children = children !== undefined ? children : [];
	}

	//start(): number {
		//const first_token = this.find(lambda n: isinstance(n, TokenNode),
	    //                       iter_=PostOrderTreeIterator)
	    //return first_token.start if first_token else None
	//}

	as_list(v: string[] | string) {
		return Array.isArray(v) ? v: [v];
	}

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
	iter_find_all(filter_: {[key: string]: string[]} | {[key: string]: string}, max_count?: number): BranchNode[] {
		const dig = new Dig(max_count);
		for (const target of this.as_list(filter_.tag)) {
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
	find(filter_: {[key: string]: string[]} | {[key: string]: string}): BranchNode {
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

/**  Syntax tree root node. */
class RootNode extends BranchNode {
	private _syntax_data: SyntaxData | undefined;

	constructor(tag: string, syntax_data?: SyntaxData, children?: Node[]) {
		super(tag, undefined, children);
		this._syntax_data = syntax_data;
	}

	//syntax_data(): SyntaxData | undefined {
	//	return this._syntax_data;
	//}
}

/**
 * Syntax tree leaf node.
 *
 * This specific class is used for null nodes.
 */
class LeafNode extends Node {
	/**  Byte offset of token's first character in source text. */
	start(): number | undefined {
		return undefined;
	}

	/** Byte offset of a character just past the token in source text. */
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
	private _text: string | undefined;

	//constructor(tag: string, _start: number, _end: number, parent?: Node) {
	constructor(tag: string, start: number, end: number, parent?: Node, text?: string) {
		super(parent);
		this.tag = tag;
		this._start = start;
		this._end = end;
		this._text = text;
	}

	syntax_data(): string {
		return this._text !== undefined ? this._text : '';
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
		if (!('children' in tree))
			return new RootNode(tag, data, []);

		for (const child of tree.children) {
			!((skip_null && child === null) || child === undefined)
			? children.push(this.transform(child, skip_null))
			: children.push(new LeafNode());
		}

		return new RootNode(tag, data, children);
	}

	transform(tree: any, skip_null: boolean): any {
		if (tree === undefined)
			return undefined;
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
		const text = tree.text;
		return new TokenNode(tag, start, end, undefined, text);
	}

	/**  Common implementation of parse_* methods */
	_parse(paths: string[], options?: Dict<any>, input_?: string): Dict<SyntaxData> {
		const _options = {
			gen_tree: true,
			skip_null: true,
			gen_tokens: false,
			gen_rawtokens: false,
			options
		};

		var args = ['-export_json'];
		if (_options.gen_tree)
			args.push('-printtree');
		if (_options.gen_tokens)
			args.push('-printtokens');
		if (_options.gen_rawtokens)
			args.push('-printrawtokens');

		const proc = execSync([this.executable, ...args, ...paths]);
		//console.log(proc.stdout);

		const json_data: SyntaxData = JSON.parse(proc.stdout);
		let data: Dict<SyntaxData> = {};

		for (const [file_path, file_json] of Object.entries(json_data)) {
			//console.log(`{${file_path}, ${file_json}}`);
			let file_data: SyntaxData;

			if (file_path === '-') {
				file_data = {source_code: input_};
			} else {
				file_data = {source_code: readFileSync(file_path)};
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

			const _data: Dict<SyntaxData> = {};
			_data[file_path] = file_data;
			Object.assign(data, _data);
		}
		return data;
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
