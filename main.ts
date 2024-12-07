import { Plugin, TFile } from 'obsidian';

export default class MyTagPlugin extends Plugin {
	onload() {
			// Добавляем команду для добавления тегов в открытый файл
			this.addCommand({
					id: 'add-tags-to-open-file',
					name: 'Добавить теги в текущий файл',
					callback: () => {
							const activeFile = this.app.workspace.getActiveFile();
							if (activeFile instanceof TFile) {
									this.addTagsToFile(activeFile);
							} else {
									console.log('Нет открытого Markdown файла.');
							}
					}
			});
	}

	async addTagsToFile(file: TFile) {
			const pathParts = this.getPathParts(file.path);
			const tags = pathParts.map((part, i) => {
				let tag;
		
				switch (true) { 
						case part.endsWith('.md'):
								tag = null;
								break;
						case part === pathParts[i - 1]:
								tag = null;
								break;
						default:
								tag = `#${part.replace(' ', '-')}`;
								break;
				}
				return tag;
		}).filter(tag => tag !== null);
			console.log(tags)
			const content = tags.join(" ") + "\n\n"; 

			const currentContent = await this.app.vault.read(file);
			await this.app.vault.modify(file, content + currentContent);
	}

	private getPathParts(path: string): string[] {
			if (path === '/') {
					return ['Vault Root'];
			} else {
					const parts = path.split('/');

					for(let i = parts.length; i <= 1; i--){
						switch (true) {
							case parts[i].endsWith('.md'):
									parts.splice(i, 1);
									break;
							case parts[i] === parts[i - 1]:
									parts.splice(i, 1);
									break; // Прерываем выполнение switch после удаления
							case i === 0: 
									parts.splice(i, 1);
									break; // Прерываем выполнение switch после удаления
						}
					}
					return parts.filter(part => part !== ''); // Удаляем пустые части
			}
	}

	onunload() {
			console.log('Auto taaging unloaded');
	}
}
