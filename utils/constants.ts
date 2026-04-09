// ── Release metadata ──────────────────────────────────────────────────────────
// Version and release date both come from package.json — update them there,
// not here.

import pkg from '../package.json';

export const RELEASE_DATE: string = pkg.releaseDate;
