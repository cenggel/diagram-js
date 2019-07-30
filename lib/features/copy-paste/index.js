import ClipboardModule from '../clipboard';
import CreateModule from '../create';
import MouseTrackingModule from '../mouse-tracking';
import RulesModule from '../rules';

import CopyPaste from './CopyPaste';


export default {
  __depends__: [
    ClipboardModule,
    CreateModule,
    MouseTrackingModule,
    RulesModule
  ],
  __init__: [ 'copyPaste' ],
  copyPaste: [ 'type', CopyPaste ]
};
