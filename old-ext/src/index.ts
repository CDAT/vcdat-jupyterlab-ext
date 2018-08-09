// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  CommandRegistry
} from '@phosphor/commands';

import {
  Widget
} from '@phosphor/widgets';

import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  InstanceTracker
} from '@jupyterlab/apputils';

import {
  ABCWidgetFactory, DocumentRegistry
} from '@jupyterlab/docregistry';

/**
 * The name of the factory that creates CSV widgets.
 */
const FACTORY = 'NetCDF';


/**
 * The table file handler extension.
 */
const plugin: JupyterLabPlugin<void> = {
  activate,
  id: '@jupyterlab/nc-viewer-extension:plugin',
  requires: [],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
export default plugin;


let commands: CommandRegistry;

/**
 * Activate the table widget extension.
 */
function activate(app: JupyterLab): void {
  commands = app.commands;

  const factory = new NCViewerFactory({
    name: FACTORY,
    fileTypes: ['NetCDF'],
    defaultFor: ['NetCDF'],
    readOnly: true
  });
  const tracker = new InstanceTracker<NCDimensionLoaderPanel>({ namespace: 'nc-viewer' });

  // Handle state restoration.
//   restorer.restore(tracker, {
//     command: 'docmanager:open',
//     args: widget => ({ path: widget.context.path, factory: FACTORY }),
//     name: widget => widget.context.path
//   });

  let fileType: DocumentRegistry.IFileType = {
    name: 'NetCDF',
    extensions: ['.nc', '.cdf'],
    mimeTypes: ['application/netcdf'],
    contentType: 'file',
    fileFormat: 'base64'
  };
  app.docRegistry.addFileType(fileType);
  app.docRegistry.addWidgetFactory(factory);

  let ft = app.docRegistry.getFileType('NetCDF');
  factory.widgetCreated.connect((sender, widget) => {
    // Track the widget.
    tracker.add(widget);
    // Notify the instance tracker if restore data needs to update.
    widget.context.pathChanged.connect(() => { tracker.save(widget); });

    if (ft) {
      widget.title.iconClass = ft.iconClass;
      widget.title.iconLabel = ft.iconLabel;
    }
  }); 
}

/**
 * A widget factory for NC widgets.
 */
export
class NCViewerFactory extends ABCWidgetFactory<NCDimensionLoaderPanel, DocumentRegistry.IModel> {
  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(context: DocumentRegistry.Context): NCDimensionLoaderPanel {
    const ncWidget = new NCDimensionLoaderPanel(context);

    commands.execute('console:create', {
      activate: true,
      path: context.path,
      preferredLanguage: context.model.defaultKernelLanguage
    }).then(consolePanel => {
      consolePanel.session.ready.then(() => {
        consolePanel.console.inject('print("Hello, world")');
      });
    });
    return ncWidget;
  }
}

/**
 * A widget for NC loaders.
 */
export
class NCDimensionLoaderPanel extends Widget implements DocumentRegistry.IReadyWidget {
  constructor(context: DocumentRegistry.Context) {
    super();
    this.context = context;
  }

  readonly context: DocumentRegistry.Context;

  readonly ready =  Promise.resolve(void 0);
}

