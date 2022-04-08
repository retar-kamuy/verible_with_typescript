import fs from 'fs';

/**
 * ``fs`` wrapper.
 */
export class FileIO {
	/** Synchronous read file method
	 *
	 * @return file data of string.
	 */
	readFileSync(path: string): string {
		let data = fs.readFileSync(path, { encoding: 'utf8' });
		//console.log(`data: ${data}`);
		return data;
	}
}

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
