// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "vs-hello-world" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
    });
    
    context.subscriptions.push(vscode.commands.registerCommand('extension.ArmViz', () => {
        ArmVizPanel.createOrShow(context.extensionPath);
    }));

    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serilizer in activation event
        vscode.window.registerWebviewPanelSerializer(ArmVizPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                console.log(`Got state: ${state}`);
                ArmVizPanel.revive(webviewPanel, context.extensionPath);
            }
        });
    }

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

class ArmVizPanel {
    public static currentPanel: ArmVizPanel | undefined;
    public static readonly viewType = 'armVizPanel';

    private readonly _panel: vscode.WebviewPanel;

    public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
        //ArmVizPanel.currentPanel = new ArmVizPanel(panel, extensionPath);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionPath: string
    ) {


        this._panel = panel;

        //this._update();

        //this._extensionPath = extensionPath;

        // Set the webview's initial html content 
        //this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        //this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        /*
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update()
            }
        }, null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
        */
    }

    private _update() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        let doc = editor.document;
        let text = doc.getText()


        this._panel.webview.html = `<html><body>Loading...</body></html>`;
    }

    public static createOrShow(extensionPath: string) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        if (ArmVizPanel.currentPanel) {
            ArmVizPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(ArmVizPanel.viewType, "ARM Visualizer", column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,

            // And restric the webview to only loading content from the allowed directory.
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionPath, 'armviz-static'))
            ]
        });

        let buf = fs.readFileSync(path.join(extensionPath, 'armviz-static/', 'index.html'));
        let html = buf.toString();

        

        ArmVizPanel.currentPanel = new ArmVizPanel(panel, extensionPath);

        ArmVizPanel.currentPanel._panel.webview.html = html;

        /*
        setInterval(() => {
            let win:any = ArmVizPanel.currentPanel._panel;
            win.window.onDidReceiveMessage(message => {
                console.log(message)
            });
        }, 1000);
        */
    }
}