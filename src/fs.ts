import path from 'path';
import fs from 'fs';

const readdirSync = (dirpath: string, options?: {recursive?: boolean, fullpath?: boolean}): string[] =>{
	let _recursive: boolean = false;
	let _dirpath: string = dirpath;

	if (options !== undefined) {
		_recursive = options.recursive === true ? options.recursive : _recursive;
		_dirpath = options.fullpath === true ? path.join(process.cwd(), dirpath) : _dirpath;
	}

	const filepaths: string[] = [];
	fs.readdirSync(_dirpath).forEach((filename: string) => {
		if (_recursive) {
			const filepath = path.join(_dirpath, filename);
			const stats = fs.statSync(filepath);
			if (stats.isFile()) {
				filepaths.push(filepath);
			}
			else if (stats.isDirectory()) {
				filepaths.push(...readdirSync(filepath, {recursive: _recursive}));
			}
		} else {
			filepaths.push(path.join(_dirpath, filename));
		}
	});
	return filepaths;
}

export { readdirSync };
