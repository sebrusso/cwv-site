import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EventEmitter } from 'events';

class FakeDiv extends EventEmitter {
  constructor() {
    super();
    this.scrollTop = 0;
    this.scrollHeight = 1000;
    this.clientHeight = 200;
  }
  addEventListener(ev, cb) { this.on(ev, cb); }
  removeEventListener(ev, cb) { this.off(ev, cb); }
  dispatchScroll() { this.emit('scroll'); }
}

test('scroll sync avoids bouncing events', () => {
  const left = new FakeDiv();
  const right = new FakeDiv();

  let leftCalls = 0;
  let rightCalls = 0;

  let isSyncingLeft = false;
  const handleLeft = () => {
    leftCalls++;
    if (!right) return;
    if (isSyncingLeft) return;
    const ratio =
      left.scrollTop / (left.scrollHeight - left.clientHeight);
    isSyncingLeft = true;
    right.scrollTop =
      ratio * (right.scrollHeight - right.clientHeight);
    right.dispatchScroll();
    isSyncingLeft = false;
  };

  let isSyncingRight = false;
  const handleRight = () => {
    rightCalls++;
    if (!left) return;
    if (isSyncingRight) return;
    const ratio =
      right.scrollTop / (right.scrollHeight - right.clientHeight);
    isSyncingRight = true;
    left.scrollTop =
      ratio * (left.scrollHeight - left.clientHeight);
    left.dispatchScroll();
    isSyncingRight = false;
  };

  left.addEventListener('scroll', handleLeft);
  right.addEventListener('scroll', handleRight);

  // simulate user scroll on left
  left.scrollTop = 100;
  left.dispatchScroll();

  assert.equal(rightCalls, 1);
  assert.equal(leftCalls, 2); // initial + skipped bounce
});
