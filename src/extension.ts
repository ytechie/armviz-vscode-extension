import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	console.log('ARMViz Extension Activated');
    
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

export function deactivate() {}

class ArmVizPanel {
    public static currentPanel: ArmVizPanel | undefined;
    public static readonly viewType = 'armVizPanel';

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private readonly _extensionPath: string;
    private readonly _context: vscode.ExtensionContext;

    private _disposed: boolean = false;

    private constructor(
        panel: vscode.WebviewPanel,
        context: vscode.ExtensionContext
    ) {
        this._panel = panel;

        this._context = context;
        this._extensionPath = context.extensionPath;

        // Set the webview's initial html content 
        this.writeHtml();

        this._context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => {
            this._sendTemplateToWebView();
        }));

        this._context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(e => {
            this._sendTemplateToWebView();
        }));

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this.writeHtml();  //is this needed?
            }
        }, null, this._disposables);
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
        const panel = vscode.window.createWebviewPanel(ArmVizPanel.viewType, "ARM Visualizer", vscode.ViewColumn.Beside, {
            // Enable javascript in the webview
            enableScripts: true,

            // And restric the webview to only loading content from the allowed directory.
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionPath, 'armviz-static'))
            ]
        });
      
        ArmVizPanel.currentPanel = new ArmVizPanel(panel, context);

        setInterval(function() {
            ArmVizPanel.currentPanel._sendTemplateToWebView();
        },2000);
    }

    public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        ArmVizPanel.currentPanel = new ArmVizPanel(panel, context);
    }

    public dispose() {
        if (this._disposed) {
			return;
        }

        this._disposed = true;
        
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

    private writeHtml() {
        let buf = fs.readFileSync(path.join(this._extensionPath, 'armviz-static/', 'index.html'));
        let html = buf.toString();
        this._panel.webview.html = html;

        
    }

    public _sendTemplateToWebView() {
        let editor = vscode.window.activeTextEditor ||
            vscode.window.visibleTextEditors[vscode.window.visibleTextEditors.length-1];

        let text = editor.document.getText();

        try {
            //JSON.parse(text);
        } catch(ex) {
            console.log('Not JSON');
            return;
        }
        

        if (!this._disposed) {
            console.log(`Template updated, sending. Length: ${text.length}`);
            this._panel.webview.postMessage({ template: text });
            console.log('Message Posted');
        }
    }
}