/**
 * Target a given value in a nested JSON object
 *
 * This module modified return value from value of object to object.
 *
 * Reference URL {@link https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-6.php}
 *
 * Attributes:
 * @param objs (object[]): object matching specified target.
*/
export default class Dig {
	private objs: any;
	private max_count: number | undefined;

	constructor(max_count?: number) {
		this.objs = [];
		this.max_count = max_count;
	}

	get_result(): any {
		return this.objs;
	}

	run(obj: any, target: string): any {
		if(this.max_count === 0) {
			return;
		}

		if(Object.values(obj).indexOf(target) > -1) {
			this.objs.push(obj);
			if (this.max_count !== undefined) {
				this.max_count -= 1;
			}
		}
		else {
			Object.values(obj).reduce((acc: any, val: any) => {
				if (acc !== undefined) {
					return acc;
				}
				if (typeof val === 'object') {
					if(val !== null)
						return this.run(val, target);
				}
			}, undefined);
		}
	}
}
