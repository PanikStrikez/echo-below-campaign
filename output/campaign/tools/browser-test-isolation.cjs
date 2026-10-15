/* Preload for file-based rehearsals: disposable profiles; no live HTTP service. */
'use strict';
const { chromium } = require('playwright');
const launch = chromium.launch.bind(chromium);
chromium.launch = async options => {
  const browser = await launch(options);
  const create = browser.newContext.bind(browser);
  browser.newContext = async settings => {
    const context = await create(settings);
    // A test that owns an ephemeral HTTP server may register a later, narrower
    // allowlist route. File-based tests cannot reach the real table or providers.
    await context.route(/^https?:\/\//, route => route.abort('blockedbyclient'));
    return context;
  };
  return browser;
};
