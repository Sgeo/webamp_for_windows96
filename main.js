/*
* Windows 96 Example app.
*/

class WebAmpWin96 extends w96.WApplication {
	constructor() {
		super();
	}
	
	async main(argv) {
		super.main(argv);


		let _Webamp = await import("https://unpkg.com/webamp");
		// Unfortunately Webamp seems to pollute .window
		let Webamp = window.Webamp;

		let paths = null;

		if(argv.length === 0) {
			paths = [await new Promise((resolve, reject) => {
				let dialog = new w96.ui.OpenFileDialog("C:/", ["mp3"], resolve);
				dialog.show();
			})];
		} else {
			paths = argv;
		}

		if(!paths) return;
		
		// Create a simple window
		const wnd = this.createWindow({
			title: "WebAmp",
			body: `
			<div></div>
			`,
			initialHeight: 300,
			initialWidth: 450,
			taskbar: true, // Show the window in taskbar
			icon: w96.ui.Theme.getIconUrl("small/empty") // Get an icon from the current theme, see c:/system/resource/themes/default/icons for available icons.
		}, true); // True specifies whether its an app window or not (aka closes any subwindows)
		
		wnd.show();

		let blobs = await Promise.all(paths.map(path => w96.FS.toBlob(path)));

		let webamp = new Webamp({
			initialTracks: blobs.map(blob => {
				return {blob: blob};
			}),
			filePickers: [{
				contextMenuName: "Windows 96...",
				requresNetwork: false,
				filePicker: () => {
					return new Promise((resolve, reject) => {
						let dialog = new w96.ui.OpenFileDialog("C:/", ["mp3"], resolve);
						dialog.show();
					}).then(path => w96.FS.toBlob(path)).then(blob => [{blob: blob}]);
				}
			}]
		});
		await webamp.renderWhenReady(wnd.getBodyContainer().querySelector("div"));
		wnd.onclose = () => {
			webamp.close();
			webamp.dispose();
		};
	}
}

registerApp("webamp", ["mp3"], function(args) {
	return w96.WApplication.execAsync(new WebAmpWin96(), args);
});

// Create shortcut for start menu
// The small/ bit is ommitted because it automatically resolves a smaller version.
u96.shell.mkShortcut("c:/system/programs/Other/WebAmp.link", "empty", "webamp");