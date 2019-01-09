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
	console.log('Congratulations, your extension "vs-armviz" is now active!');
    
    context.subscriptions.push(vscode.commands.registerCommand('extension.ArmViz', () => {
        ArmVizPanel.createOrShow(context);
    }));

    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serilizer in activation event
        vscode.window.registerWebviewPanelSerializer(ArmVizPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                console.log(`Got state: ${state}`);
                ArmVizPanel.revive(webviewPanel, context);
            }
        });
    }
}

// this method is called when your extension is deactivated
export function deactivate() {}

class ArmVizPanel {
    public static currentPanel: ArmVizPanel | undefined;
    public static readonly viewType = 'armVizPanel';

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private readonly _extensionPath: string;
    private readonly _context: vscode.ExtensionContext;

    private constructor(
        panel: vscode.WebviewPanel,
        context: vscode.ExtensionContext
    ) {
        this._panel = panel;

        this._context = context;
        this._extensionPath = context.extensionPath;

        // Set the webview's initial html content 
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update()
            }
        }, null, this._disposables);

        // Handle messages from the webview
        /*this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
        */

        //Capture the active text window
        /*var editor = vscode.window.activeTextEditor;
        if(!editor) {
            return;
        }
        */


        //this is temporary to test message sending
        setInterval(() => {
            //var foo = vscode.window.activeTextEditor;

            console.log('Sending arm template to html');
            this._sendTemplateToWebView((new Date()).toISOString());
        }, 1000);
    }

    //factory
    public static createOrShow(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        const extensionPath = context.extensionPath;

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
      
        ArmVizPanel.currentPanel = new ArmVizPanel(panel, context);
    }

    public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        ArmVizPanel.currentPanel = new ArmVizPanel(panel, context);
    }

    public dispose() {
        ArmVizPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        // let editor = vscode.window.activeTextEditor;
        // if (!editor) {
        //     return;
        // }

        // let doc = editor.document;
        // let text = doc.getText()

        let buf = fs.readFileSync(path.join(this._extensionPath, 'armviz-static/', 'index.html'));
        let html = buf.toString();
        this._panel.webview.html = html;
    }

    private _sendTemplateToWebView(template:string) {
        this._panel.webview.postMessage({ template: template });
    }
}