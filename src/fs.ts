import fs from 'fs';
import path from 'path';

/** ``fs`` wrapper. */

/**
 * Synchronous read file method
 *
 * @return file data of string.
 */
const readFileSync = (path: string): string => {
	return fs.readFileSync(path, { encoding: 'utf8' });
}

/**
 * Reference URL {@link https://qiita.com/shisama/items/affb219514eb1166198e}
 * @param dirpath 
 * @param callback 
 */
function readdir(dirpath: string, callback: any): void {
	fs.readdir(dirpath, {withFileTypes: true}, (err, dirents) => {
		if (err) {
			throw err;
		}
	
		dirents.forEach((dirent: any) => {
			const fp = path.join(dirpath, dirent.name);
			if (dirent.isDirectory()) {
				readdir(fp, callback);
			} else {
				callback(fp);
			}
		});
	});
}

function readdirSync(dirpath: string, callback: any): void {
	const filenames = fs.readdirSync(dirpath);
	filenames.forEach((filename: string) => {
		const fullPath = path.join(dirpath, filename);
		const stats = fs.statSync(fullPath);
		if (stats.isFile()) {
			//console.log(fullPath);
			callback(fullPath);
		}
		else if (stats.isDirectory()) {
			readdirSync(fullPath, callback);
		}
	});
}

export { readFileSync };

export class JsonIO {
	/**
	 * Asynchronously writes object or array to a JSON file, replacing the file if it already exists.
	 *
	 * This function is writeing using the API: {@link fs.writeFileSync}.
	 * @param file filename or file descriptor
	 * @param value A JavaScript value, usually an object or array, to be converted.
	 * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
	 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
	 */
	writeFileSync(file: fs.PathOrFileDescriptor, value: any, replacer?: (number | string)[] | null, space?: string | number): void {
		const json_data = JSON.stringify(value, replacer, space);
		fs.writeFileSync(file, json_data);
		console.log('Write JSON file.');
	};
}
