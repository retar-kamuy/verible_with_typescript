

const main = (): void => {
	//exec('echo Hello World!', (err, stdout, stderr) => {
	exec('\.\\verible-verilog-syntax.exe \.\\APB_SPI_Top.v -export_json -printtree', (err, stdout, stderr) => {
	if(err) {
		console.log(`stderr: ${stderr}`);
		return;
	}
	//console.log(`stdout: ${stdout}`);
	createFile('new.json', stdout);
})
};

const createFile = (pathName: string, source: string): void => {
	fs.writeFile(pathName, source, (err) => {
		if (err) throw err;
		if (!err) {
			console.log('JSONファイルを生成しました');
		}
	});
};

main();
