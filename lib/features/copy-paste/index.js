import ClipboardModule from '../clipboard';
import MouseTrackingModule from '../mouse-tracking';
import RulesModule from '../rules';

import CopyPaste from './CopyPaste';


export default {
  __depends__: [
    ClipboardModule,
    MouseTrackingModule,
    RulesModule
  ],
  __init__: [ 'copyPaste' ],
  copyPaste: [ 'type', CopyPaste ]
};
