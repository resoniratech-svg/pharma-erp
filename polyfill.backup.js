import * as encoding from 'text-encoding';

// Forcefully override the Hermes engine's broken TextDecoder
if (typeof global.TextDecoder !== 'undefined') {
  delete global.TextDecoder;
}
if (typeof global.TextEncoder !== 'undefined') {
  delete global.TextEncoder;
}

global.TextEncoder = encoding.TextEncoder;
global.TextDecoder = encoding.TextDecoder;
