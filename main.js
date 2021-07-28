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

		let skins = [];

		try {
			let skin_paths = w96.FS.readdir("C:/local/webamp/skins");
			let skin_blobs = await Promise.all(skin_paths.map(async path => ({"blob": await w96.FS.toBlob(path), "name": w96.FSUtil.fname(path).slice(0, -4)})));
			skins = skin_blobs.map(skin_blob => ({url: URL.createObjectURL(skin_blob.blob), name: skin_blob.name}));
			
		} catch(e) {}

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
			}],
			availableSkins: skins
		});
		await webamp.renderWhenReady(wnd.getBodyContainer().querySelector("div"));
		wnd.onclose = () => {
			webamp.close();
			webamp.dispose();
			for(skin of skins) {
				URL.revokeObjectURL(skin.url);
			}
		};
	}
}

registerApp("webamp", ["mp3"], function(args) {
	return w96.WApplication.execAsync(new WebAmpWin96(), args);
});

// Create shortcut for start menu
// The small/ bit is ommitted because it automatically resolves a smaller version.
u96.shell.mkShortcut("c:/system/programs/Other/WebAmp.link", "empty", "webamp");