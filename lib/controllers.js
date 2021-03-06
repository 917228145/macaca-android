'use strict';

const fs = require('fs');
const temp = require('temp');
const errors = require('webdriver-dfn-error-code').errors;

const _ = require('./helper');
const pkg = require('../package.json');

const NATIVE = 'NATIVE_APP';

var contollers = {};

contollers.getContext = function *() {
  return this.context;
};

contollers.getContexts = function *() {
  const contexts = [NATIVE].concat(yield this.getWebviews());
  this.contexts = contexts;
  return contexts;
};

contollers.setContext = function *(name) {
  yield this.getContexts();
  if (name !== NATIVE) {
     if (!~this.contexts.indexOf(name)) {
      throw new errors.NoSuchWindow();
     }
     const result = yield this.proxy.sendCommand('/wd/hub/session/temp/window', 'POST', { 'name': name });
     _.parseWebDriverResult(result);
     this.context = name;
  } else {
    this.proxy = null;
  }
};

contollers.click = function *(elementId) {
  return yield this.send({
    cmd: 'click',
    args: {
      elementId: elementId
    }
  });
};

contollers.swipe = function *(startX, startY, endX, endY, duration) {
  return yield this.send({
    cmd: 'swipe',
    args: {
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      duration: duration
    }
  });
};

contollers.tap = function *(elementId) {
  return yield this.send({
    cmd: 'click',
    args: {
      elementId: elementId
    }
  });
};

contollers.setValue = function *(elementId, value) {
  var args = {
    elementId: elementId,
    text: value.join('')
  };
  return yield this.send({
    cmd: 'setText',
    args: args
  });
};

contollers.getText = function *(elementId) {
  var args = {
    elementId: elementId
  };
  return yield this.send({
    cmd: 'getText',
    args: args
  });
};

contollers.clearText = function *(elementId) {
  var args = {
    elementId: elementId
  };
  return yield this.send({
    cmd: 'clearText',
    args: args
  });
};

contollers.findElement = function *(strategy, selector, elementId) {
  var args = {
    strategy: strategy,
    selector: selector,
    multiple: false
  };
  return yield this.send({
    cmd: 'find',
    args: args
  });
};

contollers.findElements = function *(strategy, selector, elementId) {
  var args = {
    strategy: strategy,
    selector: selector,
    multiple: true
  };
  return yield this.send({
    cmd: 'find',
    args: args
  });
};

contollers.getScreenshot = function *() {
  const swapFile = temp.openSync({
    prefix: `${pkg.name}-screenshot`,
    suffix: '.png'
  });
  const swapFilePath = swapFile.path;
  const remoteFile = `${this.adb.getTmpDir()}/screenshot.png`;
  const cmd = `/system/bin/rm ${remoteFile}; /system/bin/screencap -p ${remoteFile}`;
  yield this.adb.shell(cmd);

  _.rimraf(swapFilePath);

  yield this.adb.pull(remoteFile, swapFilePath);

  var base64 = null;

  try {
    let data = fs.readFileSync(swapFilePath);
    base64 = new Buffer(data).toString('base64');
  } catch (e) {
    throw new errors.NoSuchWindow();
  }

  _.rimraf(swapFilePath);
  return base64;
};

module.exports = contollers;
