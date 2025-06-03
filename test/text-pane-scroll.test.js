import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { TextPane } from '../src/components/TextPane.tsx';

function setupDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.getComputedStyle = dom.window.getComputedStyle;
  return dom;
}

test('paired scroll panes sync', async () => {
  const dom = setupDom();
  const container1 = document.createElement('div');
  const container2 = document.createElement('div');
  document.body.appendChild(container1);
  document.body.appendChild(container2);

  const ref1 = createRef();
  const ref2 = createRef();

  createRoot(container1).render(
    React.createElement(TextPane, { id: 'a', text: 'x\n'.repeat(500), pairedRef: ref2, ref: ref1 })
  );
  createRoot(container2).render(
    React.createElement(TextPane, { id: 'b', text: 'y\n'.repeat(500), pairedRef: ref1, ref: ref2 })
  );

  await new Promise(r => setTimeout(r, 0));

  Object.assign(ref1.current, { scrollHeight: 1000, clientHeight: 200 });
  Object.assign(ref2.current, { scrollHeight: 800, clientHeight: 200 });
  ref1.current.scrollTop = 100;

  ref1.current.dispatchEvent(new dom.window.Event('scroll'));

  const expected = (100 / (1000 - 200)) * (800 - 200);
  assert.equal(ref2.current.scrollTop, expected);
});

test('no sync when paired pane has no overflow', async () => {
  const dom = setupDom();
  const container1 = document.createElement('div');
  const container2 = document.createElement('div');
  document.body.appendChild(container1);
  document.body.appendChild(container2);

  const ref1 = createRef();
  const ref2 = createRef();

  createRoot(container1).render(
    React.createElement(TextPane, { id: 'a', text: 'x\n'.repeat(500), pairedRef: ref2, ref: ref1 })
  );
  createRoot(container2).render(
    React.createElement(TextPane, { id: 'b', text: 'short', pairedRef: ref1, ref: ref2 })
  );

  await new Promise(r => setTimeout(r, 0));

  Object.assign(ref1.current, { scrollHeight: 500, clientHeight: 200 });
  Object.assign(ref2.current, { scrollHeight: 100, clientHeight: 100 });
  ref1.current.scrollTop = 50;

  ref1.current.dispatchEvent(new dom.window.Event('scroll'));

  assert.equal(ref2.current.scrollTop, 0);
});
