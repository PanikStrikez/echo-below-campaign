/* Private, read-only audit snapshot. This module never reads or writes campaign state. */
(() => {
  'use strict';
  if (globalThis.location?.hash === '#player') return;

  const PAGE_SIZE = 25;
  const DATA_URL = new URL('./map-audit/Map-Register-Data.js', document.currentScript?.src || document.baseURI).href;
  const tabs = [['checklist', 'Checklist'], ['locations', 'Locations'], ['maps', 'Maps']];
  const views = Object.fromEntries(tabs.map(([id]) => [id, {query: '', status: '', limit: PAGE_SIZE, expanded: new Set()}]));
  let host, root, data, loading, error = '', activeTab = 'checklist', buttonNode, listening = false;
  const isPlayer = () => globalThis.location?.hash === '#player';
  const list = value => Array.isArray(value) ? value : [];
  const text = value => value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  const label = value => text(value).replace(/[-_]/g, ' ');
  const el = (tag, value, parent, className) => {
    const node = document.createElement(tag);
    if (value != null) node.textContent = text(value);
    if (className) node.className = className;
    parent?.append(node);
    return node;
  };
  function button(parent, title, action) {
    const node = el('button', title, parent);
    node.type = 'button';
    node.addEventListener('click', () => { if (!isPlayer()) action(); });
    return node;
  }
  function detail(parent, title) {
    const node = el('details', null, parent, 'story-card');
    el('summary', title, node);
    return node;
  }
  function field(parent, title, value) {
    if (value == null || value === '' || Array.isArray(value) && !value.length) return;
    const row = el('p', null, parent);
    row.style.overflowWrap = 'anywhere';
    el('strong', title + ': ', row);
    el('span', Array.isArray(value) ? value.map(text).join(' · ') : text(value), row);
  }
  function lines(parent, title, values) {
    const items = list(values);
    if (!items.length) return;
    el('h4', title, parent);
    const ul = el('ul', null, parent);
    for (const value of items) el('li', text(value), ul);
  }
  function sources(parent, values) {
    const refs = list(values);
    if (!refs.length) return;
    const box = detail(parent, 'Source references');
    for (const ref of refs) {
      if (typeof ref === 'string') { field(box, 'Source', ref); continue; }
      field(box, 'Source', ref.source);
      field(box, 'Location in source', ref.locator);
      field(box, 'Verification', ref.verification);
    }
  }
  function related(parent, title, values, kind) {
    const ids = list(values);
    if (!ids.length) return;
    const records = list(data?.[kind]);
    field(parent, title, ids.map(id => {
      const record = records.find(item => item.id === id);
      return record ? `${record.name || record.title} [${id}]` : id;
    }));
  }
  function statusOf(record) {
    return text(activeTab === 'locations' ? record.disclosure?.status || 'unspecified' : record.status || 'unspecified');
  }
  function validate(value) {
    if (!value || !value.schemaVersion || !['locations', 'maps', 'checklist'].every(key => Array.isArray(value[key]))) {
      throw Error('The map register data is missing or has an unsupported structure.');
    }
    return value;
  }
  function loadData() {
    if (isPlayer()) return Promise.reject(Error('The map register is available only in the DM view.'));
    if (data) return Promise.resolve(data);
    if (globalThis.ECHO_MAP_REGISTER_DATA) {
      try { return Promise.resolve(data = validate(globalThis.ECHO_MAP_REGISTER_DATA)); }
      catch (failure) { return Promise.reject(failure); }
    }
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = DATA_URL;
      script.async = true;
      script.dataset.mapRegisterData = 'true';
      script.onload = () => {
        script.onload = script.onerror = null;
        try { data = validate(globalThis.ECHO_MAP_REGISTER_DATA); resolve(data); }
        catch (failure) { script.remove(); reject(failure); }
      };
      script.onerror = () => {
        script.onload = script.onerror = null;
        script.remove();
        reject(Error('The local map register could not be loaded. Check that map-audit/Map-Register-Data.js is beside the campaign files, then retry.'));
      };
      (document.head || document.body).append(script);
    }).finally(() => { loading = null; });
    return loading;
  }
  function renderLocation(parent, record) {
    field(parent, 'Type', record.type);
    const ancestor = list(data.locations).find(item => item.id === record.parentId);
    field(parent, 'Parent location', ancestor ? `${ancestor.name} [${ancestor.id}]` : record.parentId);
    field(parent, 'Geography', record.geography);
    field(parent, 'Placement', record.placement?.description);
    field(parent, 'Placement basis', record.placement?.basis);
    field(parent, 'Placement confidence', record.placement?.confidence);
    field(parent, 'Campaign role', record.campaignRole);
    field(parent, 'Disclosure', record.disclosure?.detail);
    related(parent, 'Related maps', record.mapIds, 'maps');
    field(parent, 'Existing identifiers', record.legacyIds);
    lines(parent, 'Notes', record.notes);
    sources(parent, record.sourceRefs);
  }
  function renderMap(parent, record) {
    field(parent, 'Category', record.category);
    field(parent, 'Purpose', record.purpose);
    field(parent, 'Intended audience', record.audience);
    // Paths are inert text: no image, fetch, link navigation or player presentation.
    field(parent, 'File path', record.path);
    const native = record.native || {};
    field(parent, 'Native size', native.width && native.height ? `${native.width} × ${native.height}` : 'Not recorded');
    field(parent, 'Format', native.format);
    field(parent, 'Scene identifiers', record.sceneIds);
    related(parent, 'Locations', record.locationIds, 'locations');
    field(parent, 'Verification', record.verification);
    lines(parent, 'Issues', record.issues);
    sources(parent, record.sourceRefs);
  }
  function renderChecklist(parent, record) {
    field(parent, 'Priority', record.priority);
    field(parent, 'Reason', record.reason);
    lines(parent, 'Actions to consider', record.actions);
    related(parent, 'Locations', record.locationIds, 'locations');
    related(parent, 'Maps', record.mapIds, 'maps');
  }
  function render() {
    if (!root?.isConnected || isPlayer()) return;
    root.replaceChildren();
    el('p', `DM ONLY · Audit snapshot${data?.auditDate ? ' · ' + text(data.auditDate) : ''}. This register describes prepared geography and map coverage, not live discoveries.`, root, 'story-note');
    if (!data) {
      const message = el('p', error || 'Loading the local map register…', root, error ? 'ai-error' : 'help');
      message.setAttribute('role', error ? 'alert' : 'status');
      if (error) button(root, 'Retry loading', () => { void open(); });
      return;
    }
    const summary = detail(root, 'Audit summary and limitations');
    for (const [key, value] of Object.entries(data.summary || {})) field(summary, label(key), value);
    lines(summary, 'Limitations', data.limitations);
    field(summary, 'Data version', data.schemaVersion);

    const navigation = el('div', null, root, 'button-row');
    navigation.setAttribute('aria-label', 'Map register sections');
    for (const [id, title] of tabs) {
      const control = button(navigation, title, () => { activeTab = id; render(); });
      control.setAttribute('aria-pressed', String(activeTab === id));
      if (activeTab === id) control.classList.add('primary');
    }
    const records = list(data[activeTab]);
    const view = views[activeTab];
    const controls = el('div', null, root, 'story-section');
    const searchLabel = el('label', 'Search', controls, 'story-field');
    const search = el('input', null, searchLabel);
    search.type = 'search';
    search.value = view.query;
    search.placeholder = 'Name, place, source or file path';
    search.setAttribute('aria-label', 'Search map register');
    const filterLabel = el('label', activeTab === 'locations' ? 'Disclosure status' : 'Status', controls, 'story-field');
    const filter = el('select', null, filterLabel);
    filter.setAttribute('aria-label', activeTab === 'locations' ? 'Filter disclosure status' : 'Filter status');
    el('option', 'All statuses', filter).value = '';
    for (const value of [...new Set(records.map(statusOf))].sort()) el('option', label(value), filter).value = value;
    filter.value = view.status;
    const count = el('p', '', root, 'help');
    count.setAttribute('role', 'status');
    count.setAttribute('aria-live', 'polite');
    const results = el('div', null, root);
    results.dataset.mapRegisterResults = activeTab;
    const footer = el('div', null, root, 'button-row');

    function renderRows() {
      if (isPlayer() || !root?.isConnected || !results.isConnected) return;
      results.replaceChildren();
      footer.replaceChildren();
      const query = view.query.trim().toLocaleLowerCase();
      const filtered = records.filter(record => (!view.status || statusOf(record) === view.status) && (!query || JSON.stringify(record).toLocaleLowerCase().includes(query)));
      const shown = filtered.slice(0, view.limit);
      count.textContent = `${shown.length} of ${filtered.length} matching ${activeTab} · ${records.length} total`;
      if (!filtered.length) el('p', 'No matching records. Try another search or status.', results, 'help');
      for (const [index, record] of shown.entries()) {
        const name = record.name || record.title || record.id || 'Untitled record';
        const prefix = activeTab === 'checklist' && record.priority != null ? `Priority ${text(record.priority)} · ` : '';
        const box = detail(results, `${prefix}${name} · ${label(statusOf(record))}`);
        const key = record.id || `${activeTab}-${index}`;
        box.open = view.expanded.has(key);
        box.addEventListener('toggle', () => {
          if (!box.isConnected || isPlayer()) return;
          if (box.open) view.expanded.add(key); else view.expanded.delete(key);
        });
        field(box, 'Register ID', record.id);
        if (activeTab === 'locations') renderLocation(box, record);
        else if (activeTab === 'maps') renderMap(box, record);
        else renderChecklist(box, record);
      }
      if (shown.length < filtered.length) button(footer, `Show more (${Math.min(PAGE_SIZE, filtered.length - shown.length)})`, () => {
        view.limit += PAGE_SIZE;
        renderRows();
      });
    }
    search.addEventListener('input', () => { view.query = search.value; view.limit = PAGE_SIZE; renderRows(); });
    filter.addEventListener('change', () => { view.status = filter.value; view.limit = PAGE_SIZE; renderRows(); });
    renderRows();
  }
  async function open() {
    if (isPlayer() || !host) return;
    error = '';
    host.content('Map register', node => { root = node; render(); });
    try { await loadData(); }
    catch (failure) { error = failure.message || 'The map register could not be loaded.'; }
    render();
  }
  function mountButton() {
    if (isPlayer() || buttonNode?.isConnected) return;
    const target = document.getElementById('cockpit-tools-World');
    if (!target) return;
    buttonNode = button(target, 'Map register', () => { void open(); });
    buttonNode.id = 'open-map-register';
    buttonNode.title = 'Private map coverage and location audit';
  }
  function init(options) {
    if (isPlayer() || typeof options?.content !== 'function') return false;
    host = options;
    mountButton();
    if (!listening) {
      listening = true;
      globalThis.addEventListener('hashchange', () => {
        if (isPlayer()) {
          buttonNode?.remove();
          if (root?.isConnected) root.replaceChildren();
          root = null;
          data = null;
          delete globalThis.ECHO_MAP_REGISTER_DATA;
          delete globalThis.ECHO_MAP_REGISTER_SHA256;
        } else mountButton();
      });
    }
    return true;
  }
  globalThis.ECHO_MAP_REGISTER_UI = {init, open};
})();
