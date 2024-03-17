"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpCodelensProvider = exports.FuncCodelensProvider = void 0;
const vscode = require("vscode");
// ============================ Tool.1 CodelensProvider for functions in python =================================== //
class FuncCodelensProvider {
    constructor() {
        this.codeLenses = [];
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        this.regex = /\bdef\s+\w+\s*\(.*\)\s*:/g;
        // this.regex = /\b(?<=^|\n)([ \t]*)(def\s+\w[\w_]*\s*\([^)]*\)\s*:(?:\n\1[ \t].*)*?\n\1.*?)(?=\n|$):/g
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }
    provideCodeLenses(document, token) {
        if (vscode.workspace.getConfiguration("codelens-sample").get("enableCodeLens", true)) {
            this.codeLenses = [];
            const regex_func = new RegExp(this.regex);
            const text = document.getText();
            let matches;
            // match function in python
            while ((matches = regex_func.exec(text)) !== null) {
                // const line = document.lineAt(document.positionAt(matches.index).line); // matches.index: 匹配文本在 text 字符串中的起始位置索引
                // locate the strat position of the function
                const startlineIndex = document.positionAt(matches.index).line;
                const startline = document.lineAt(startlineIndex);
                const startLineIndentation = startline.firstNonWhitespaceCharacterIndex;
                // locate the end position of the function
                let endline;
                let endlineIndex = startlineIndex + 1;
                while (endlineIndex < document.lineCount) {
                    endline = document.lineAt(endlineIndex);
                    if (endline.firstNonWhitespaceCharacterIndex === startLineIndentation)
                        break;
                    endlineIndex++;
                }
                // const indexOf = line.text.indexOf(matches[0]);
                // const position = new vscode.Position(line.lineNumber, indexOf);
                // const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                // process
                if (endline) {
                    const range = new vscode.Range(startline.range.start, endline.range.end);
                    if (range) {
                        // process the text through GPT
                        const textAtRange = document.getText(range);
                        console.log(textAtRange);
                        // const reply = aiProcess(textAtRange);
                        // set the output og codelens
                        const codelens = new vscode.CodeLens(range);
                        codelens.command = {
                            title: "🐱Good job! You've defined a new function.",
                            tooltip: "click here!",
                            command: "catsprite.codelensAction",
                            arguments: ["" + textAtRange, false],
                        };
                        this.codeLenses.push(codelens);
                    }
                }
            }
            return this.codeLenses;
        }
        return [];
    }
    resolveCodeLens(codeLens, token) {
        if (vscode.workspace.getConfiguration("catsprite").get("enableCodeLens", true)) {
            // codeLens.command = {
            // 	title: "Good job! You are defining a new function.",  // direct output between lines
            // 	tooltip: "Here are some advice provided by charGPT"+codeLens.range, // hover action
            // 	command: "codelens-sample.codelensAction", // click action(def in extension.ts)
            // 	arguments: ["Argument 1", false]
            // };
            return codeLens;
        }
        return null;
    }
}
exports.FuncCodelensProvider = FuncCodelensProvider;
// ============================ Tool.2 CodelensProvider for if in python =================================== //
class ImpCodelensProvider {
    constructor() {
        this.codeLenses = [];
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        this.regex = /\bimport\b.*$/gm;
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }
    provideCodeLenses(document, token) {
        if (vscode.workspace.getConfiguration("codelens-sample").get("enableCodeLens", true)) {
            this.codeLenses = [];
            const regex_func = new RegExp(this.regex);
            const text = document.getText();
            let matches;
            // match function in python
            while ((matches = regex_func.exec(text)) !== null) {
                // const line = document.lineAt(document.positionAt(matches.index).line); // matches.index: 匹配文本在 text 字符串中的起始位置索引
                // locate the strat position of the function
                const startlineIndex = document.positionAt(matches.index).line;
                const startline = document.lineAt(startlineIndex);
                //const startLineIndentation = startline.firstNonWhitespaceCharacterIndex;
                // locate the end position of the function
                let endline;
                // locate the end position of the function
                let endlineIndex = startlineIndex;
                if (startlineIndex > 0) {
                    const prevLine = document.lineAt(startlineIndex - 1);
                    if (!prevLine.text.includes('import')) {
                        while (endlineIndex < document.lineCount) {
                            endline = document.lineAt(endlineIndex);
                            if (endline.text.includes('import ') || endline.firstNonWhitespaceCharacterIndex === 0)
                                break;
                            endlineIndex++;
                        }
                        // const indexOf = line.text.indexOf(matches[0]);
                        // const position = new vscode.Position(line.lineNumber, indexOf);
                        // const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                        // process
                        if (endline) {
                            const range = new vscode.Range(startline.range.start, endline.range.end);
                            if (range) {
                                // process the text through GPT
                                const textAtRange = document.getText(range);
                                console.log(textAtRange);
                                // const reply = aiProcess(textAtRange);
                                // set the output og codelens
                                const codelens = new vscode.CodeLens(range);
                                codelens.command = {
                                    title: "😽Bear up! I think we are off to a good start. Don't forget to carefully check your import library",
                                    tooltip: "click here to get advice from your Cat Sprite",
                                    command: "catsprite.codelensAction",
                                    arguments: ["", false]
                                };
                                this.codeLenses.push(codelens);
                            }
                        }
                    }
                }
                else {
                    while (endlineIndex < document.lineCount) {
                        endline = document.lineAt(endlineIndex);
                        if (endline.text.includes('import ') || endline.firstNonWhitespaceCharacterIndex === 0)
                            break;
                        endlineIndex++;
                    }
                    // const indexOf = line.text.indexOf(matches[0]);
                    // const position = new vscode.Position(line.lineNumber, indexOf);
                    // const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                    // process
                    if (endline) {
                        const range = new vscode.Range(startline.range.start, endline.range.end);
                        if (range) {
                            // process the text through GPT
                            const textAtRange = document.getText(range);
                            console.log(textAtRange);
                            // const reply = aiProcess(textAtRange);
                            // set the output og codelens
                            const codelens = new vscode.CodeLens(range);
                            codelens.command = {
                                title: "😽Bear up! I think we are off to a good start. Don't forget to carefully check your import library",
                                tooltip: "",
                                command: "codelens-sample.codelensAction",
                                arguments: ["Argument 1", false]
                            };
                            this.codeLenses.push(codelens);
                        }
                    }
                }
            }
            return this.codeLenses;
        }
        return [];
    }
    resolveCodeLens(codeLens, token) {
        if (vscode.workspace.getConfiguration("catsprite").get("enableCodeLens", true)) {
            // codeLens.command = {
            // 	title: "Good job! You are defining a new function.",  // direct output between lines
            // 	tooltip: "Here are some advice provided by charGPT"+codeLens.range, // hover action
            // 	command: "codelens-sample.codelensAction", // click action(def in extension.ts)
            // 	arguments: ["Argument 1", false]
            // };
            return codeLens;
        }
        return null;
    }
}
exports.ImpCodelensProvider = ImpCodelensProvider;
//# sourceMappingURL=CodelensProvider.js.map