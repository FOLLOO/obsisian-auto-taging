import { Plugin, TFile, Setting, PluginSettingTab, App, Notice } from "obsidian";

interface AutoTagingSettings {
	addCurrentFile: boolean;
	ingnoreRootFile: boolean;
	tagSeparator: string;
}


const DEFAULT_SETTINGS: AutoTagingSettings = {
	addCurrentFile: true,
	ingnoreRootFile: true,
	tagSeparator: "default",
};

export default class AutoTagingPlugin extends Plugin {
	settings: AutoTagingSettings;

	async onload() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData
		);

		this.addCommand({
			id: "add-tags-to-open-file", 
			name: "Add tags to the current file", 
			checkCallback: (checking: boolean) => { 
					const activeFile = this.app.workspace.getActiveFile();
					
					if (activeFile instanceof TFile) { 
							if (!checking) { 
									this.addTagsToFile(activeFile); 
							}
							return true; 
					}
					
					if (!checking) { 
							new Notice("There is no open Markdown file."); 
					}
					return false; 
			},
		});
		
		this.addSettingTab(new AutoTagingSettingsTab(this.app, this));
	}

	private deafutlTag(tag: string){
		var hashtag = tag.split(' ').reduce(function(tag, word) {
			return tag + word.charAt(0).toUpperCase() + word.substring(1);
		}, '#');
		return hashtag;
	}

	
	async addTagsToFile(file: TFile) {
		const pathParts = this.getPathParts(file.path);

		const tags = pathParts
			.map((part, i) => {
				let tag;
				switch (true) {
					case this.settings.addCurrentFile && part.endsWith(".md"):
						if(this.settings.tagSeparator === "default"){
							let prev = part.replace('.md', '')
							tag = this.deafutlTag(prev) 
						}else{
							let prev = part.replace(/ /g, this.settings.tagSeparator)
							tag = "#" + prev.replace(".md", "");
						} 
						break;
					case this.settings.ingnoreRootFile &&
						part === pathParts[i - 1]:
						tag = null;
						break;
					default:
						tag = `#${part.replace(" ", this.settings.tagSeparator)}`; 
						break;
				}
				return tag;
			})
			.filter((tag) => tag !== null);
		const content = tags.join(" ") + "\n\n";
		const currentContent = await this.app.vault.read(file);
		await this.app.vault.modify(file, content + currentContent);
	}

	private getPathParts(path: string): string[] {
		
		
		if (path === "/") {
			return ["Vault Root"];
		} else {
			const parts = path.split("/");

			for (let i = parts.length; i <= 1; i--) {
				switch (true) {
					case this.settings.addCurrentFile && parts[i].endsWith(".md"):
						if(this.settings.tagSeparator === "default"){
							let prev = parts[i].replace('.md', '')
							parts[i] = this.deafutlTag(prev) 
						}else{
							let prev = parts[i].replace(/ /g, this.settings.tagSeparator)
							parts[i] = "#" + prev.replace(".md", "");
						} 
						break;
					case this.settings.ingnoreRootFile && parts[i] === parts[i - 1]:
						parts.splice(i, 1); // тоже самое что и в первом варианте
						break;
				}
			}
			return parts.filter((part) => part !== "");
		}
	}

	onunload() {
		new Notice("Auto taaging unloaded")
	}
}

class AutoTagingSettingsTab extends PluginSettingTab {
	plugin: AutoTagingPlugin;

	constructor(app: App, plugin: AutoTagingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Auto Taging: Settings' });

		new Setting(containerEl)
			.setName("Add the current file")
			.setDesc("Toggle this option to enable automatic tagging of the document you are currently editing. When enabled, the plugin will extract and add relevant tags based on the file name and path.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.addCurrentFile)
					.onChange(async (value) => {
						this.plugin.settings.addCurrentFile = value;
						await this.plugin.saveData(this.plugin.settings);
					})
			);
		new Setting(containerEl)
			.setName("Ignore root path")
			.setDesc("Ignore the root path when tagging. Example: 'Obsidian/my note' will replace to #myNote else #Obsidian #myNote")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.ingnoreRootFile)
					.onChange(async (value) => {
						this.plugin.settings.ingnoreRootFile = value;
						await this.plugin.saveData(this.plugin.settings);
					})
			);
		new Setting(containerEl)
			.setName("Enter tag separator")
			.setDesc(
				"Enter tag sepatator. Exmaple: ' - ' will change ('default' vlaue) #ExampleTag to #Exmaple-tag"
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.tagSeparator)
					.setPlaceholder("Enter tag separator")
					.onChange(async (value) => {
						this.plugin.settings.tagSeparator = value;
						await this.plugin.saveData(this.plugin.settings);
					})
			);

			containerEl.createEl('p', { text: 'For instructions on how to use this plugin, check out the README on GitHub' });	
			containerEl.createEl('a', {attr: {href:"https://github.com/FOLLOO/obsisian-auto-taging"},text:"GitHub"})
	}
}
