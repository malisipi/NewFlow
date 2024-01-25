class JsonDatabase {
    #config;
    /*
     * defaultStructure<string(JSON)>(null)
     * defaultStructureFrom<string(File Location)>(null)
     * fill_missing<bool>(false)
     */
    file_name;
    content;

    async init (){
        this.autosave = this.#config.disable_autosave != true;

        let content = this.#config.defaultStructure ?? "{}";
        try {
            content = String(await fs.readFile(this.file_name));
        } catch {};
        if(typeof(content) == "object") {
            this.content = content;
        } else {
            this.content = JSON.parse(content);
        };
        await this.#fill_missing();
    }

    async #fill_missing (){
        //this.#config.defaultStructure
    }

    async update_file (){
        console.warn("Updated: " + this.file_name);
        await fs.writeFile(this.file_name, JSON.stringify(this.content))
    }

    constructor(file_name, config = {}) {
        this.file_name = file_name;
        this.#config = config;
        return this;
    };
};
