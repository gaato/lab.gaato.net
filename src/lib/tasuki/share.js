// @ts-nocheck -- generated code; its types are in share.d.ts.
// Generated: the share button from gaato/tasuki 0c93af658ba4 (examples/web/src/lab_share),
// built with `moon build --target js --release`. Do not edit; see README.md.
function _M0TPC16string10StringView(param0, param1, param2) {
  this.str = param0;
  this.start = param1;
  this.end = param2;
}
function $oob() {
  throw new Error("Index out of bounds");
}
class $PanicError extends Error {}
function $panic(message) {
  throw new $PanicError(message);
}
function _M0TPB13StringBuilder(param0) {
  this.val = param0;
}
const _M0FPB12random__seed = () => {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj != null && typeof cryptoObj.getRandomValues === "function") {
    try {
      const array = new Uint32Array(1);
      cryptoObj.getRandomValues(array);
      return array[0] | 0; // Convert to signed 32
    } catch (_) {
      // The host refuses Web Crypto here, e.g. Workers at module load
    }
  }
  return Math.floor(Math.random() * 0x100000000) | 0; // Fallback to Math.random
};
const _M0FPB19int__to__string__js = (x, radix) => {
  return x.toString(radix);
};
function _M0TPB4IterGsE(param0, param1) {
  this.f = param0;
  this.size_hint = param1;
}
function $make_array_len_and_init(a, b) {
  const arr = new Array(a);
  arr.fill(b);
  return arr;
}
function _M0TPB5ArrayGsE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function $compare_int(a, b) {
  return (a >= b) - (a <= b);
}
function _M0TPB5ArrayGRP25gaato11tasuki__dom9PlacementE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TPB3MapGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(param0, param1, param2, param3, param4, param5, param6) {
  this.entries = param0;
  this.size = param1;
  this.capacity = param2;
  this.capacity_mask = param3;
  this.grow_at = param4;
  this.head = param5;
  this.tail = param6;
}
function _M0TPB3MapGsRP25gaato11tasuki__dom7DomNodeE(param0, param1, param2, param3, param4, param5, param6) {
  this.entries = param0;
  this.size = param1;
  this.capacity = param2;
  this.capacity_mask = param3;
  this.grow_at = param4;
  this.head = param5;
  this.tail = param6;
}
function _M0TPB5EntryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(param0, param1, param2, param3, param4, param5) {
  this.prev = param0;
  this.next = param1;
  this.psl = param2;
  this.hash = param3;
  this.key = param4;
  this.value = param5;
}
function _M0TPB5EntryGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(param0, param1, param2, param3, param4, param5) {
  this.prev = param0;
  this.next = param1;
  this.psl = param2;
  this.hash = param3;
  this.key = param4;
  this.value = param5;
}
function _M0TPB5EntryGsRP25gaato11tasuki__dom7DomNodeE(param0, param1, param2, param3, param4, param5) {
  this.prev = param0;
  this.next = param1;
  this.psl = param2;
  this.hash = param3;
  this.key = param4;
  this.value = param5;
}
function _M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4None() {}
_M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4None.prototype.$tag = 0;
const _M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4None__ = new _M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4None();
function _M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4Some(param0) {
  this._0 = param0;
}
_M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4Some.prototype.$tag = 1;
function _M0TPB8MutLocalGORPB5EntryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEEE(param0) {
  this.val = param0;
}
function _M0TPB8MutLocalGiE(param0) {
  this.val = param0;
}
function _M0TPB12MutArrayViewGsE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TP25gaato6tasuki4StepGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(param0, param1, param2, param3) {
  this.next = param0;
  this.focus = param1;
  this.announce = param2;
  this.cmd = param3;
}
function _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE4Done() {}
_M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE4Done.prototype.$tag = 0;
const _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE4Done__ = new _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE4Done();
function _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE7Request(param0, param1, param2, param3, param4, param5) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
  this._3 = param3;
  this._4 = param4;
  this._5 = param5;
}
_M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE7Request.prototype.$tag = 1;
function _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE4Call(param0, param1, param2, param3, param4) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
  this._3 = param3;
  this._4 = param4;
}
_M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE4Call.prototype.$tag = 2;
function _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE5After(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE5After.prototype.$tag = 3;
function _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE5Batch(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE5Batch.prototype.$tag = 4;
function _M0DTP25gaato6tasuki5Focus4Keep() {}
_M0DTP25gaato6tasuki5Focus4Keep.prototype.$tag = 0;
const _M0DTP25gaato6tasuki5Focus4Keep__ = new _M0DTP25gaato6tasuki5Focus4Keep();
function _M0DTP25gaato6tasuki5Focus2To(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki5Focus2To.prototype.$tag = 1;
function _M0DTP25gaato6tasuki8Announce6Silent() {}
_M0DTP25gaato6tasuki8Announce6Silent.prototype.$tag = 0;
const _M0DTP25gaato6tasuki8Announce6Silent__ = new _M0DTP25gaato6tasuki8Announce6Silent();
function _M0DTP25gaato6tasuki8Announce6Polite(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki8Announce6Polite.prototype.$tag = 1;
function _M0DTP25gaato6tasuki8Announce9Assertive(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki8Announce9Assertive.prototype.$tag = 2;
function _M0TP25gaato6tasuki9ComponentGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(param0, param1, param2, param3, param4) {
  this.name = param0;
  this.init = param1;
  this.update = param2;
  this.view = param3;
  this.tag = param4;
}
function _M0TPB5ArrayGRP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgEE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0DTP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgE4Text(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgE4Text.prototype.$tag = 0;
function _M0DTP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgE4Elem(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgE4Elem.prototype.$tag = 1;
function _M0TP25gaato6tasuki4NodeGRP35gaato6tasuki4demo8ShareMsgE(param0, param1, param2, param3, param4) {
  this.tag = param0;
  this.id = param1;
  this.attrs = param2;
  this.handlers = param3;
  this.children = param4;
}
function _M0TPB5ArrayGUssEE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TPB5ArrayGRP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgEE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0DTP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgE5Click(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgE5Click.prototype.$tag = 0;
function _M0DTP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgE6Submit(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgE6Submit.prototype.$tag = 1;
function _M0DTP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgE5Input(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgE5Input.prototype.$tag = 2;
function _M0DTP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgE6Toggle(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgE6Toggle.prototype.$tag = 3;
function _M0DTP35gaato6tasuki4demo5Share5Ready(param0) {
  this._0 = param0;
}
_M0DTP35gaato6tasuki4demo5Share5Ready.prototype.$tag = 0;
function _M0DTP35gaato6tasuki4demo5Share7Sharing() {}
_M0DTP35gaato6tasuki4demo5Share7Sharing.prototype.$tag = 1;
const _M0DTP35gaato6tasuki4demo5Share7Sharing__ = new _M0DTP35gaato6tasuki4demo5Share7Sharing();
function _M0DTP35gaato6tasuki4demo8ShareMsg5Press() {}
_M0DTP35gaato6tasuki4demo8ShareMsg5Press.prototype.$tag = 0;
const _M0DTP35gaato6tasuki4demo8ShareMsg5Press__ = new _M0DTP35gaato6tasuki4demo8ShareMsg5Press();
function _M0DTP35gaato6tasuki4demo8ShareMsg8Finished(param0) {
  this._0 = param0;
}
_M0DTP35gaato6tasuki4demo8ShareMsg8Finished.prototype.$tag = 1;
function _M0DTP35gaato6tasuki4demo8ShareMsg5Broke(param0) {
  this._0 = param0;
}
_M0DTP35gaato6tasuki4demo8ShareMsg5Broke.prototype.$tag = 2;
const _M0FP25gaato11tasuki__dom15find__container = id => {
  const container = document.getElementById(id);
  if (!container) throw new Error(`tasuki: missing container #${id}`);
  return container;
};
const _M0FP25gaato11tasuki__dom18run__in__container = (() => {
  const key = Symbol.for("gaato/tasuki_dom.work");
  return (container, action) => {
    const queue = container[key] ??= [];
    queue.push(action);
    if (queue.length !== 1) return;
    // A patch error must not strand a remount requested by a DOM callback.
    let errors;
    for (let i = 0; i < queue.length; i++) {
      try {
        queue[i]();
      } catch (error) {
        (errors ??= []).push(error);
      }
    }
    queue.length = 0;
    if (errors?.length === 1) throw errors[0];
    if (errors) throw new AggregateError(errors, "tasuki: container work failed");
  };
})();
const _M0FP25gaato11tasuki__dom15blocked__within = (root, target) => {
  const blocked = target.closest("[aria-disabled='true'],[inert],[hidden],:disabled:not(fieldset)");
  return target.matches(":disabled") || (blocked !== null && root.contains(blocked));
};
const _M0FP25gaato11tasuki__dom14collect__edits = (mounted, view, blocked, record) => {
  if (!mounted.adopt) return;
  const textTypes = ["text", "email", "search", "url", "tel", "password", "number"];
  for (const field of view.querySelectorAll("input[id],textarea[id]")) {
    if (blocked(field)) continue;
    if (field.type === "checkbox") {
      if (field.checked !== field.defaultChecked) record("change", field.id, "", field.checked);
    } else if ((field.localName === "textarea" || textTypes.includes(field.type)) &&
               field.value !== field.defaultValue) {
      // Some input types normalize the server-rendered default value.
      const rendered = field.cloneNode(false);
      rendered.value = field.defaultValue;
      if (field.value !== rendered.value) record("input", field.id, field.value, false);
    }
  }
};
const _M0FP25gaato11tasuki__dom8delegate = ({root, signal}, view, blocked, handle) => {
  const submitButton = form => Array.from(form.elements).find(el =>
    el.type === "submit" || el.type === "image") ??
    form.querySelector("input[type='image']");
  root.addEventListener("keydown", event => {
    // An implicit submit's event targets the form, so block Enter at its source
    // when it originates inside an inoperable subtree.
    const target = event.target;
    if (event.key === "Enter" && target instanceof HTMLInputElement &&
        target.form && view.contains(target) && blocked(target)) event.preventDefault();
  }, {signal});
  for (const kind of ["click", "submit", "input", "change"]) {
    root.addEventListener(kind, event => {
      if (kind === "submit") event.preventDefault();
      const target = event.target;
      if (!(target instanceof Element) || !view.contains(target)) return;
      if (blocked(target)) {
        event.preventDefault();
        return;
      }
      if (kind === "submit" && target instanceof HTMLFormElement) {
        const button = submitButton(target);
        if ((button && blocked(button)) || (event.submitter && blocked(event.submitter))) return;
      }
      if (kind === "input" && target.type === "checkbox") return;
      if (kind === "change" && target.type !== "checkbox") return;
      for (let el = target; el !== view; el = el.parentElement) {
        if (el.id && handle(kind, el.id, target.value ?? "", target.checked ?? false)) return;
      }
    }, {signal});
  }
};
const _M0FP25gaato11tasuki__dom19expose__test__hooks = ({root, signal}, name, pending, resolve) => {
  const hooks = {
    pending, resolve: (key, outcome, value = "") => resolve(key, outcome, value),
    state: () => root.dataset.state, renders: 0, announcements: [],
  };
  const index = window.__tasuki ??= Object.create(null);
  index[name] = hooks;
  signal.addEventListener("abort", () => {
    if (index[name] === hooks) delete index[name];
  }, {once: true});
  return (rendered, politeness, text) => {
    if (rendered) hooks.renders++;
    if (politeness) hooks.announcements.push({politeness, text});
  };
};
const _M0FP25gaato11tasuki__dom13focus__within = (root, id) => {
  const element = root.querySelector("#" + CSS.escape(id));
  if (!element) return;
  const ancestors = [];
  for (let el = element.parentElement; el; el = el.parentElement) ancestors.push(el);
  for (const el of ancestors.reverse()) {
    if (el.localName === "details" && !el.open) el.open = true;
    if (el.hasAttribute("popover") && typeof el.showPopover === "function" &&
        !el.matches(":popover-open")) el.showPopover();
  }
  element.focus();
};
const _M0FP25gaato11tasuki__dom13live__regions = ({root, signal}, liveStyle) => {
  const regions = new Map();
  for (const region of root.querySelectorAll(":scope > [data-tasuki-live]")) {
    regions.set(region.dataset.tasukiLive, region);
    for (const declaration of liveStyle.split(";")) {
      const [property, value] = declaration.split(":");
      region.style.setProperty(property, value);
    }
  }
  let timer, assertive, polite;
  signal.addEventListener("abort", () => {
    clearTimeout(timer);
    for (const region of regions.values()) region.textContent = "";
  }, {once: true});
  function flush() {
    if (assertive !== undefined) {
      regions.get("assertive").textContent = assertive;
      assertive = undefined;
      if (polite !== undefined) timer = setTimeout(flush, 50);
    } else {
      regions.get("polite").textContent = polite;
      polite = undefined;
    }
  }
  return (politeness, text) => {
    if (signal.aborted) return;
    regions.get(politeness).textContent = "";
    if (politeness === "assertive") {
      assertive = text;
      polite = undefined;
    } else {
      polite = text;
      // A polite update must not replace or postpone the pending error.
      if (assertive !== undefined) return;
    }
    clearTimeout(timer);
    timer = setTimeout(flush, 50);
  };
};
const _M0FP25gaato11tasuki__dom5mount = (() => {
  // Independently linked bundles can still mount into the same container.
  const key = Symbol.for("gaato/tasuki_dom.mount");
  return (container, name, dispose) => {
    const previous = container[key];
    previous?.controller.abort();
    if (previous?.root.parentElement === container && previous.root.dataset.c !== name) {
      previous.root.remove();
    }
    let root = Array.from(container.children).find(el => el.dataset.c === name);
    const adopt = root && root !== previous?.root;
    if (!root) {
      root = document.createElement("div");
      root.dataset.c = name;
      root.appendChild(document.createElement("div")).setAttribute("data-tasuki-view", "");
      for (const politeness of ["polite", "assertive"]) {
        const region = root.appendChild(document.createElement("div"));
        region.dataset.tasukiLive = politeness;
        region.setAttribute("aria-live", politeness);
        region.setAttribute("aria-atomic", "true");
      }
      container.append(root);
    }
    const controller = new AbortController();
    controller.signal.addEventListener("abort", dispose, {once: true});
    container[key] = {root, controller};
    return {root, signal: controller.signal, adopt};
  };
})();
const _M0FP25gaato11tasuki__dom13mounted__root = mounted => mounted.root;
const _M0FP25gaato11tasuki__dom17identified__nodes = root => Array.from(root.querySelectorAll("[id]"));
const _M0FP25gaato11tasuki__dom8node__id = node => node.nodeType === 1 ? node.id : "";
const _M0FP25gaato11tasuki__dom12place__child = (parent, node, index) => {
  const before = parent.childNodes[index] ?? null;
  if (before === node) return;
  if (node.parentNode && node.isConnected === parent.isConnected &&
      typeof parent.moveBefore === "function") {
    parent.moveBefore(node, before);
    return;
  }
  const focused = document.activeElement;
  const restoreFocus = node.contains(focused);
  parent.insertBefore(node, before);
  if (restoreFocus && document.activeElement !== focused) {
    focused.focus({preventScroll: true});
  }
};
const _M0FP25gaato11tasuki__dom12child__nodes = parent => Array.from(parent.childNodes);
const _M0FP25gaato11tasuki__dom8is__text = node => node.nodeType === 3;
const _M0FP25gaato11tasuki__dom13make__element = tag => document.createElement(tag);
const _M0FP25gaato11tasuki__dom10make__text = text => document.createTextNode(text);
const _M0FP25gaato11tasuki__dom12matches__tag = (node, tag) => node.nodeType === 1 && node.localName === tag.toLowerCase();
const _M0FP25gaato11tasuki__dom12patch__attrs = (() => {
  const previous = new WeakMap();
  return (node, id, names, values) => {
    const attrs = new Map();
    if (id) attrs.set("id", id);
    for (let i = 0; i < names.length; i++) {
      const name = names[i].toLowerCase();
      if (name !== "id" && /^[a-z_:][a-z0-9_:-]*$/.test(name) && !attrs.has(name)) {
        attrs.set(name, values[i]);
      }
    }
    const input = node.localName === "input";
    const had = previous.get(node);
    // Details owns its live open state until the view changes its open attribute.
    const browserOpen = node.localName === "details" &&
      (had?.has("open") ?? false) === attrs.has("open");
    const skip = name => (input && (name === "value" || name === "checked")) ||
      (browserOpen && name === "open");
    for (const name of node.getAttributeNames()) {
      if (!skip(name) && !attrs.has(name)) node.removeAttribute(name);
    }
    for (const [name, value] of attrs) {
      if (!skip(name) && node.getAttribute(name) !== value) node.setAttribute(name, value);
    }
    if (input) {
      const value = attrs.get("value") ?? "";
      if ((node.type !== "file" || value === "") && (attrs.has("value") || had?.has("value")) &&
          node.value !== value) node.value = value;
      if (node.checked !== attrs.has("checked")) node.checked = attrs.has("checked");
    }
    previous.set(node, attrs);
  };
})();
const _M0FP25gaato11tasuki__dom11patch__text = (node, text) => { if (node.data !== text) node.data = text; };
function _M0TP25gaato11tasuki__dom9Placement(param0, param1) {
  this.node = param0;
  this.children = param1;
}
const _M0FP25gaato11tasuki__dom14trim__children = (parent, keep) => {
  while (parent.childNodes.length > keep) parent.lastChild.remove();
};
function _M0TPB9ArrayViewGUsRP25gaato11tasuki__dom7DomNodeEE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TPB5ArrayGURP25gaato11tasuki__dom7DomNodeiEE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
const _M0FP25gaato11tasuki__dom10set__state = (root, tag) => { root.dataset.state = tag; };
const _M0FP25gaato11tasuki__dom10view__slot = root => root.querySelector(":scope > [data-tasuki-view]");
const _M0FP25gaato11tasuki__dom5after = (ms, fire) => {
  const handle = setTimeout(fire, ms);
  return () => clearTimeout(handle);
};
const _M0FP25gaato11tasuki__dom10host__call = (name, arg, complete) => {
  let live = true;
  Promise.resolve()
    .then(() => {
      if (!live) return;
      const host = globalThis.tasukiHost;
      const fn = host?.[name];
      if (typeof fn !== "function") throw new Error(`no host function ${name}`);
      if (live) return Reflect.apply(fn, host, [arg]);
    })
    .then(
      value => { if (live) complete(true, value == null ? "" : String(value)); },
      error => { if (live) complete(false, String(error?.name ?? error)); },
    );
  return () => { live = false; };
};
const _M0FP25gaato11tasuki__dom7request = (method, url, body, complete) => {
  const controller = new AbortController();
  const init = {method, signal: controller.signal};
  if (!/^(GET|HEAD)$/i.test(method) || body !== "") init.body = body;
  async function run() {
    let ok = false;
    let value;
    try {
      const response = await fetch(url, init);
      value = response.ok ? await response.text() : response.statusText || `HTTP ${response.status}`;
      ok = response.ok;
    } catch {
      value = "network";
    }
    complete(ok, value);
  }
  void run();
  return () => controller.abort();
};
function _M0TP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgE(param0, param1, param2) {
  this.generation = param0;
  this.cmd = param1;
  this.cancel = param2;
}
function _M0DTP25gaato6tasuki7Outcome7Succeed(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki7Outcome7Succeed.prototype.$tag = 0;
function _M0DTP25gaato6tasuki7Outcome4Fail(param0) {
  this._0 = param0;
}
_M0DTP25gaato6tasuki7Outcome4Fail.prototype.$tag = 1;
function _M0DTP25gaato6tasuki7Outcome4Fire() {}
_M0DTP25gaato6tasuki7Outcome4Fire.prototype.$tag = 2;
const _M0DTP25gaato6tasuki7Outcome4Fire__ = new _M0DTP25gaato6tasuki7Outcome4Fire();
function _M0TP25gaato11tasuki__dom7EffectsGRP35gaato6tasuki4demo8ShareMsgE(param0, param1) {
  this.entries = param0;
  this.generation = param1;
}
function _M0TPB9ArrayViewGUsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEEE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TPB8MutLocalGbE(param0) {
  this.val = param0;
}
function _M0TPB9ArrayViewGUsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEEE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TPB8MutLocalGRP35gaato6tasuki4demo5ShareE(param0) {
  this.val = param0;
}
function _M0TPB8MutLocalGsE(param0) {
  this.val = param0;
}
function _M0TPB8MutLocalGWbssEuE(param0) {
  this.val = param0;
}
function _M0TPB5ArrayGRP35gaato6tasuki4demo8ShareMsgE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TPB5ArrayGRP25gaato6tasuki8AnnounceE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TP35gaato6tasuki4demo10ShareTexts(param0, param1, param2, param3, param4) {
  this.label = param0;
  this.copied = param1;
  this.failed = param2;
  this.button_class = param3;
  this.said_class = param4;
}
const _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger = { method_0: _M0IPB13StringBuilderPB6Logger13write__string, method_1: _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE, method_2: _M0IPB13StringBuilderPB6Logger11write__view, method_3: _M0IPB13StringBuilderPB6Logger11write__char, method_4: _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE, method_5: _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE };
const _M0MPB4Iter4nextN6constrS284GsE = 0;
const _M0MPB4Iter4nextN6constrS285GsE = 0;
const _M0MPB4Iter3newN6constrS302GsE = 0;
const _M0FP25gaato6tasuki16visually__hidden = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0";
const _M0FP35gaato6tasuki4demo11share__viewN6constrS1182 = "share-said";
const _M0FPB4seed = _M0FPB12random__seed();
const _M0FP25gaato6tasuki13attr__allowedN6recordS1117 = new _M0TPC16string10StringView("on", 0, 2);
function _M0FPB13consume4__acc(acc, input) {
  const _p = (acc >>> 0) + ((Math.imul(input, -1028477379) | 0) >>> 0) | 0;
  return Math.imul(_p << 17 | (_p >>> 15 | 0), 668265263) | 0;
}
function _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGsEE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const _tmp$2 = dst_offset + i | 0;
        const _tmp$3 = src_offset + i | 0;
        if (_tmp$2 >>> 0 < dst.length) {
          dst[_tmp$2] = _tmp$3 >>> 0 < src.length ? src[_tmp$3] : $oob();
        } else {
          $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp = len - 1 | 0;
    let _tmp$2 = len > 0;
    while (true) {
      const i = _tmp;
      const _more = _tmp$2;
      if (_more) {
        const _tmp$3 = dst_offset + i | 0;
        const _tmp$4 = src_offset + i | 0;
        if (_tmp$3 >>> 0 < dst.length) {
          dst[_tmp$3] = _tmp$4 >>> 0 < src.length ? src[_tmp$4] : $oob();
        } else {
          $oob();
        }
        _tmp = i - 1 | 0;
        _tmp$2 = i > 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPB18UninitializedArray12unsafe__blitGRP35gaato6tasuki4demo8ShareMsgE(dst, dst_offset, src, src_offset, len) {
  _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGsEE(dst, dst_offset, src, src_offset, len);
}
function _M0MPB18UninitializedArray23unsafe__make__and__blitGRP35gaato6tasuki4demo8ShareMsgE(src, allocate_len, src_offset, dst_offset, blit_len) {
  const dst = new Array(allocate_len);
  _M0MPB18UninitializedArray12unsafe__blitGRP35gaato6tasuki4demo8ShareMsgE(dst, dst_offset, src, src_offset, blit_len);
  return dst;
}
function _M0MPB13StringBuilder13write__objectGiE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGiE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB18UninitializedArray23make__and__blit_2einnerGRP35gaato6tasuki4demo8ShareMsgE(src, allocate_len, len, src_offset, dst_offset) {
  let _tmp;
  if (allocate_len >= 0) {
    let _tmp$2;
    if (len >= 0) {
      let _tmp$3;
      const _p = src.length;
      if (src_offset >= 0 && src_offset <= (_p - len | 0)) {
        _tmp$3 = dst_offset >= 0 && dst_offset <= (allocate_len - len | 0);
      } else {
        _tmp$3 = false;
      }
      _tmp$2 = _tmp$3;
    } else {
      _tmp$2 = false;
    }
    _tmp = _tmp$2;
  } else {
    _tmp = false;
  }
  if (_tmp) {
    return _M0MPB18UninitializedArray23unsafe__make__and__blitGRP35gaato6tasuki4demo8ShareMsgE(src, allocate_len, src_offset, dst_offset, len);
  } else {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(8);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "bounds check failed: allocate_len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, allocate_len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, src_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", dst_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, dst_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src.length = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, src.length);
    return $panic(_string_builder.val);
  }
}
function _M0MPB13StringBuilder21StringBuilder_2einner(capacity) {
  return capacity >= 0 ? new _M0TPB13StringBuilder("") : $panic("capacity must be non-negative");
}
function _M0IPB13StringBuilderPB6Logger11write__char(self, ch) {
  self.val = `${self.val}${String.fromCodePoint(ch)}`;
}
function _M0IPB13StringBuilderPB6Logger13write__string(self, str) {
  self.val = `${self.val}${str}`;
}
function _M0IP016_24default__implPB7Compare6op__ltGsE(x, y) {
  return _M0IPC16string6StringPB7Compare7compare(x, y) < 0;
}
function _M0IP016_24default__implPB7Compare6op__gtGsE(x, y) {
  return _M0IPC16string6StringPB7Compare7compare(x, y) > 0;
}
function _M0IP016_24default__implPB7Compare6op__geGsE(x, y) {
  return _M0IPC16string6StringPB7Compare7compare(x, y) >= 0;
}
function _M0FPB14avalanche__acc(acc) {
  let acc$2 = acc;
  acc$2 = acc$2 ^ (acc$2 >>> 15 | 0);
  acc$2 = Math.imul(acc$2, -2048144777) | 0;
  acc$2 = acc$2 ^ (acc$2 >>> 13 | 0);
  acc$2 = Math.imul(acc$2, -1028477379) | 0;
  acc$2 = acc$2 ^ (acc$2 >>> 16 | 0);
  return acc$2;
}
function _M0FPB13finalize__acc(acc) {
  return _M0FPB14avalanche__acc(acc);
}
function _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPC16string6String21clamped__view_2einner(self, start, end) {
  const len = self.length;
  let lo;
  if (start <= 0) {
    lo = 0;
  } else {
    if (start >= len) {
      lo = len;
    } else {
      let _tmp;
      const _p = self.charCodeAt(start);
      if (_p >= 56320 && _p <= 57343) {
        const _p$2 = self.charCodeAt(start - 1 | 0);
        _tmp = _p$2 >= 55296 && _p$2 <= 56319;
      } else {
        _tmp = false;
      }
      if (_tmp) {
        lo = start + 1 | 0;
      } else {
        lo = start;
      }
    }
  }
  let hi;
  if (end === undefined) {
    hi = len;
  } else {
    const _Some = end;
    const _e = _Some;
    if (_e <= 0) {
      hi = 0;
    } else {
      if (_e >= len) {
        hi = len;
      } else {
        let _tmp;
        const _p = self.charCodeAt(_e);
        if (_p >= 56320 && _p <= 57343) {
          const _p$2 = self.charCodeAt(_e - 1 | 0);
          _tmp = _p$2 >= 55296 && _p$2 <= 56319;
        } else {
          _tmp = false;
        }
        if (_tmp) {
          hi = _e - 1 | 0;
        } else {
          hi = _e;
        }
      }
    }
  }
  return lo >= hi ? new _M0TPC16string10StringView(self, lo, lo) : new _M0TPC16string10StringView(self, lo, hi);
}
function _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(self, value, start, len) {
  _M0IPB13StringBuilderPB6Logger11write__view(self, _M0MPC16string6String21clamped__view_2einner(value, start, start + len | 0));
}
function _M0IP016_24default__implPB4Show6outputGiE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC13int3IntPB4Show10to__string(self));
}
function _M0MPB4Iter4nextGsE(self) {
  const _func = self.f;
  const result = _func();
  const _bind = self.size_hint;
  if (result === undefined) {
    self.size_hint = _M0MPB4Iter4nextN6constrS285GsE;
  } else {
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _n = _Some;
      self.size_hint = _n > 0 ? _n - 1 | 0 : _M0MPB4Iter4nextN6constrS284GsE;
    }
  }
  return result;
}
function _M0MPC13int3Int18to__string_2einner(self, radix) {
  return _M0FPB19int__to__string__js(self, radix);
}
function _M0MPB4Iter3newGsE(f, size_hint) {
  let size_hint$2;
  if (size_hint === undefined) {
    size_hint$2 = undefined;
  } else {
    const _Some = size_hint;
    const _n = _Some;
    size_hint$2 = _n > 0 ? _n : _M0MPB4Iter3newN6constrS302GsE;
  }
  return new _M0TPB4IterGsE(f, size_hint$2);
}
function _M0MPC15array10FixedArray5makeiGsE(length, value) {
  if (length <= 0) {
    return [];
  } else {
    const array = $make_array_len_and_init(length, value(0));
    let _tmp = 1;
    while (true) {
      const i = _tmp;
      if (i < length) {
        if (i >>> 0 < array.length) {
          array[i] = value(i);
        } else {
          $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return array;
  }
}
function _M0MPC16string10StringView9to__owned(self) {
  return self.str.substring(self.start, self.end);
}
function _M0MPC16string6String20unsafe__range__equal(self, start, other, other_start, len) {
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < len) {
      if (self.charCodeAt(start + i | 0) === other.charCodeAt(other_start + i | 0)) {
      } else {
        return false;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return true;
}
function _M0IPB13StringBuilderPB6Logger11write__view(self, str) {
  self.val = `${self.val}${_M0MPC16string10StringView9to__owned(str)}`;
}
function _M0MPC16string6String8find__by(self, pred) {
  const _p = new _M0TPC16string10StringView(self, 0, self.length);
  const _p$2 = _p.str;
  const _p$3 = _p.start;
  const _p$4 = _p.end;
  let _tmp = _p$3;
  let _tmp$2 = 0;
  while (true) {
    const _p$5 = _tmp;
    const _p$6 = _tmp$2;
    if (_p$5 < _p$4) {
      let _p$7;
      let _p$8;
      _L: {
        const _p$9 = _p$2.charCodeAt(_p$5);
        if (_p$9 >= 55296 && _p$9 <= 56319 && (_p$5 + 1 | 0) < _p$4) {
          const _p$10 = _p$2.charCodeAt(_p$5 + 1 | 0);
          if (_p$10 >= 56320 && _p$10 <= 57343) {
            const _tmp$3 = _p$5 + 2 | 0;
            const _p$11 = (((Math.imul(_p$9 - 55296 | 0, 1024) | 0) + _p$10 | 0) - 56320 | 0) + 65536 | 0;
            _p$7 = _tmp$3;
            _p$8 = _p$11;
            break _L;
          } else {
            const _tmp$3 = _p$5 + 1 | 0;
            const _p$11 = _p$9;
            _p$7 = _tmp$3;
            _p$8 = _p$11;
            break _L;
          }
        } else {
          const _tmp$3 = _p$5 + 1 | 0;
          const _p$10 = _p$9;
          _p$7 = _tmp$3;
          _p$8 = _p$10;
          break _L;
        }
      }
      if (pred(_p$8)) {
        return _p$6;
      }
      _tmp = _p$7;
      const _p$9 = _p$8;
      _tmp$2 = _p$6 + (_p$9 <= 65535 ? 1 : 2) | 0;
      continue;
    } else {
      return undefined;
    }
  }
}
function _M0MPC16string10StringView11has__prefix(self, str) {
  const str_len = str.end - str.start | 0;
  return str_len <= (self.end - self.start | 0) ? (str_len === 0 || self.str.charCodeAt(self.start) === str.str.charCodeAt(str.start) ? _M0MPC16string6String20unsafe__range__equal(self.str, self.start, str.str, str.start, str_len) : false) : false;
}
function _M0MPC16string6String11has__prefix(self, str) {
  return _M0MPC16string10StringView11has__prefix(new _M0TPC16string10StringView(self, 0, self.length), str);
}
function _M0MPC15array5Array13Array_2einnerGsE(capacity) {
  return capacity >= 0 ? (capacity === 0 ? new _M0TPB5ArrayGsE([], 0) : new _M0TPB5ArrayGsE(new Array(capacity), 0)) : $panic("capacity must be non-negative");
}
function _M0FPB23array__growth__capacity(current, len, required) {
  if (required < len) {
    $panic("Array capacity overflow");
  }
  const start = current === 0 ? 8 : current;
  let _tmp = start;
  while (true) {
    const space = _tmp;
    if (space < required) {
      const next = Math.imul(space, 2) | 0;
      if (next <= space) {
        return required;
      }
      _tmp = next;
      continue;
    } else {
      return space;
    }
  }
}
function _M0MPC15array5Array8capacityGRP35gaato6tasuki4demo8ShareMsgE(self) {
  return self.buf.length;
}
function _M0MPC15array5Array14resize__bufferGRP35gaato6tasuki4demo8ShareMsgE(self, new_capacity) {
  const old_buf = self.buf;
  self.buf = [];
  const len = self.len;
  const copy_len = len < new_capacity ? len : new_capacity;
  const new_buf = _M0MPB18UninitializedArray23make__and__blit_2einnerGRP35gaato6tasuki4demo8ShareMsgE(old_buf, new_capacity, copy_len, 0, 0);
  self.buf = new_buf;
}
function _M0MPC15array5Array7reallocGRP35gaato6tasuki4demo8ShareMsgE(self, required) {
  const old_cap = _M0MPC15array5Array8capacityGRP35gaato6tasuki4demo8ShareMsgE(self);
  const new_cap = _M0FPB23array__growth__capacity(old_cap, self.len, required);
  _M0MPC15array5Array14resize__bufferGRP35gaato6tasuki4demo8ShareMsgE(self, new_cap);
}
function _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(self, value) {
  if (self.len === self.buf.length) {
    _M0MPC15array5Array7reallocGRP35gaato6tasuki4demo8ShareMsgE(self, self.len + 1 | 0);
  }
  const length = self.len;
  self.buf[length] = value;
  self.len = length + 1 | 0;
}
function _M0MPB4Iter9to__arrayGsE(self) {
  const _bind = self.size_hint;
  let result;
  if (_bind === undefined) {
    result = new _M0TPB5ArrayGsE([], 0);
  } else {
    const _Some = _bind;
    const _n = _Some;
    result = _M0MPC15array5Array13Array_2einnerGsE(_n);
  }
  while (true) {
    const _bind$2 = _M0MPB4Iter4nextGsE(self);
    if (_bind$2 === undefined) {
      break;
    } else {
      const _Some = _bind$2;
      const _x = _Some;
      _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(result, _x);
      continue;
    }
  }
  return result;
}
function _M0MPC14char4Char20is__ascii__uppercase(self) {
  return self >= 65 && self <= 90;
}
function _M0MPC16string6String9to__lower(self) {
  const _bind = _M0MPC16string6String8find__by(self, (c) => _M0MPC14char4Char20is__ascii__uppercase(c));
  if (_bind === undefined) {
    return self;
  } else {
    const _Some = _bind;
    const _idx = _Some;
    const buf = _M0MPB13StringBuilder21StringBuilder_2einner(self.length);
    const head = new _M0TPC16string10StringView(self, 0, _idx);
    _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(buf, head.str, head.start, _idx);
    const _bind_end = self.length;
    let _tmp = _idx;
    while (true) {
      const _string_index = _tmp;
      if (_string_index < _bind_end) {
        let _decoded_next_string_index;
        let _decoded_char;
        _L: {
          const _bind$2 = self.charCodeAt(_string_index);
          if (_bind$2 >= 55296 && _bind$2 <= 56319 && (_string_index + 1 | 0) < _bind_end) {
            const _bind$3 = self.charCodeAt(_string_index + 1 | 0);
            if (_bind$3 >= 56320 && _bind$3 <= 57343) {
              const _tmp$2 = _string_index + 2 | 0;
              const _p = (((Math.imul(_bind$2 - 55296 | 0, 1024) | 0) + _bind$3 | 0) - 56320 | 0) + 65536 | 0;
              _decoded_next_string_index = _tmp$2;
              _decoded_char = _p;
              break _L;
            } else {
              const _tmp$2 = _string_index + 1 | 0;
              const _p = _bind$2;
              _decoded_next_string_index = _tmp$2;
              _decoded_char = _p;
              break _L;
            }
          } else {
            const _tmp$2 = _string_index + 1 | 0;
            const _p = _bind$2;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          }
        }
        if (_M0MPC14char4Char20is__ascii__uppercase(_decoded_char)) {
          _M0IPB13StringBuilderPB6Logger11write__char(buf, _decoded_char + 32 | 0);
        } else {
          _M0IPB13StringBuilderPB6Logger11write__char(buf, _decoded_char);
        }
        _tmp = _decoded_next_string_index;
        continue;
      } else {
        break;
      }
    }
    return buf.val;
  }
}
function _M0IPC16string6StringPB7Compare7compare(self, other) {
  const len = self.length;
  const _bind = $compare_int(len, other.length);
  if (_bind === 0) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const x = self.charCodeAt(i);
        const y = other.charCodeAt(i);
        if (x !== y) {
          return x < y ? -1 : 1;
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return 0;
  } else {
    return _bind;
  }
}
function _M0IPC13int3IntPB4Show10to__string(self) {
  return _M0MPC13int3Int18to__string_2einner(self, 10);
}
function _M0MPC15array5Array20unsafe__make__uninitGRP25gaato11tasuki__dom9PlacementE(len) {
  return new _M0TPB5ArrayGRP25gaato11tasuki__dom9PlacementE(new Array(len), len);
}
function _M0MPC16option6Option10unwrap__orGsE(self, default$$) {
  if (self === undefined) {
    return default$$;
  } else {
    const _Some = self;
    const _t = _Some;
    return _t;
  }
}
function _M0FPB21calc__grow__threshold(capacity) {
  return (Math.imul(capacity / 16 | 0, 13) | 0) + ((Math.imul(capacity % 16 | 0, 13) | 0) / 16 | 0) | 0;
}
function _M0MPC13int3Int20next__power__of__two(self) {
  if (self >= 0) {
    if (self <= 1) {
      return 1;
    }
    if (self > 1073741824) {
      return 1073741824;
    }
    return (2147483647 >> (Math.clz32(self - 1 | 0) - 1 | 0)) + 1 | 0;
  } else {
    return $panic();
  }
}
function _M0FPB8new__mapGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(capacity) {
  const capacity$2 = _M0MPC13int3Int20next__power__of__two(capacity);
  const _bind = capacity$2 - 1 | 0;
  const _bind$2 = _M0FPB21calc__grow__threshold(capacity$2);
  const _bind$3 = $make_array_len_and_init(capacity$2, undefined);
  const _bind$4 = undefined;
  return new _M0TPB3MapGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(_bind$3, 0, capacity$2, _bind, _bind$2, _bind$4, -1);
}
function _M0FPB8new__mapGsRP25gaato11tasuki__dom7DomNodeE(capacity) {
  const capacity$2 = _M0MPC13int3Int20next__power__of__two(capacity);
  const _bind = capacity$2 - 1 | 0;
  const _bind$2 = _M0FPB21calc__grow__threshold(capacity$2);
  const _bind$3 = $make_array_len_and_init(capacity$2, undefined);
  const _bind$4 = undefined;
  return new _M0TPB3MapGsRP25gaato11tasuki__dom7DomNodeE(_bind$3, 0, capacity$2, _bind, _bind$2, _bind$4, -1);
}
function _M0FPB21capacity__for__length(length) {
  if (length <= _M0FPB21calc__grow__threshold(1073741824)) {
    let capacity = _M0MPC13int3Int20next__power__of__two(length);
    if (length > _M0FPB21calc__grow__threshold(capacity)) {
      capacity = Math.imul(capacity, 2) | 0;
    }
    return capacity;
  } else {
    return $panic("Map capacity overflow");
  }
}
function _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, entry) {
  const _bind = self.tail;
  if (_bind === -1) {
    self.head = entry;
  } else {
    const _tmp = self.entries;
    const _p = _bind >>> 0 < _tmp.length ? _tmp[_bind] : $oob();
    let _tmp$2;
    if (_p === undefined) {
      _tmp$2 = $panic();
    } else {
      const _p$2 = _p;
      _tmp$2 = _p$2;
    }
    _tmp$2.next = entry;
  }
  self.tail = idx;
  self.entries[idx] = entry;
  self.size = self.size + 1 | 0;
}
function _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom7DomNodeE(self, idx, entry) {
  const _bind = self.tail;
  if (_bind === -1) {
    self.head = entry;
  } else {
    const _tmp = self.entries;
    const _p = _bind >>> 0 < _tmp.length ? _tmp[_bind] : $oob();
    let _tmp$2;
    if (_p === undefined) {
      _tmp$2 = $panic();
    } else {
      const _p$2 = _p;
      _tmp$2 = _p$2;
    }
    _tmp$2.next = entry;
  }
  self.tail = idx;
  self.entries[idx] = entry;
  self.size = self.size + 1 | 0;
}
function _M0MPB3Map10set__entryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, entry, new_idx) {
  const _bind = entry.next;
  if (_bind === undefined) {
    self.tail = new_idx;
  } else {
    const _Some = _bind;
    const _next = _Some;
    _next.prev = new_idx;
  }
  self.entries[new_idx] = entry;
}
function _M0MPB3Map10set__entryGsRP25gaato11tasuki__dom7DomNodeE(self, entry, new_idx) {
  const _bind = entry.next;
  if (_bind === undefined) {
    self.tail = new_idx;
  } else {
    const _Some = _bind;
    const _next = _Some;
    _next.prev = new_idx;
  }
  self.entries[new_idx] = entry;
}
function _M0MPB3Map10push__awayGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, entry) {
  let _tmp = entry.psl + 1 | 0;
  let _tmp$2 = idx + 1 & self.capacity_mask;
  let _tmp$3 = entry;
  while (true) {
    const psl = _tmp;
    const idx$2 = _tmp$2;
    const entry$2 = _tmp$3;
    const _bind = self.entries[idx$2];
    if (_bind === undefined) {
      entry$2.psl = psl;
      _M0MPB3Map10set__entryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, entry$2, idx$2);
      return;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (psl > _curr_entry.psl) {
        entry$2.psl = psl;
        _M0MPB3Map10set__entryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, entry$2, idx$2);
        _tmp = _curr_entry.psl + 1 | 0;
        _tmp$2 = idx$2 + 1 & self.capacity_mask;
        _tmp$3 = _curr_entry;
        continue;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = idx$2 + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map10push__awayGsRP25gaato11tasuki__dom7DomNodeE(self, idx, entry) {
  let _tmp = entry.psl + 1 | 0;
  let _tmp$2 = idx + 1 & self.capacity_mask;
  let _tmp$3 = entry;
  while (true) {
    const psl = _tmp;
    const idx$2 = _tmp$2;
    const entry$2 = _tmp$3;
    const _bind = self.entries[idx$2];
    if (_bind === undefined) {
      entry$2.psl = psl;
      _M0MPB3Map10set__entryGsRP25gaato11tasuki__dom7DomNodeE(self, entry$2, idx$2);
      return;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (psl > _curr_entry.psl) {
        entry$2.psl = psl;
        _M0MPB3Map10set__entryGsRP25gaato11tasuki__dom7DomNodeE(self, entry$2, idx$2);
        _tmp = _curr_entry.psl + 1 | 0;
        _tmp$2 = idx$2 + 1 & self.capacity_mask;
        _tmp$3 = _curr_entry;
        continue;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = idx$2 + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map20rehash__place__entryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, outer) {
  const hash = outer.hash;
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      outer.psl = psl;
      outer.prev = self.tail;
      _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, outer);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr = _Some;
      if (psl > _curr.psl) {
        _M0MPB3Map10push__awayGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, _curr);
        outer.psl = psl;
        outer.prev = self.tail;
        _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, outer);
        return undefined;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = idx + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map20rehash__place__entryGsRP25gaato11tasuki__dom7DomNodeE(self, outer) {
  const hash = outer.hash;
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      outer.psl = psl;
      outer.prev = self.tail;
      _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom7DomNodeE(self, idx, outer);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr = _Some;
      if (psl > _curr.psl) {
        _M0MPB3Map10push__awayGsRP25gaato11tasuki__dom7DomNodeE(self, idx, _curr);
        outer.psl = psl;
        outer.prev = self.tail;
        _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom7DomNodeE(self, idx, outer);
        return undefined;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = idx + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map4growGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self) {
  const old_head = self.head;
  const new_capacity = self.capacity << 1;
  self.entries = $make_array_len_and_init(new_capacity, undefined);
  self.capacity = new_capacity;
  self.capacity_mask = new_capacity - 1 | 0;
  self.grow_at = _M0FPB21calc__grow__threshold(self.capacity);
  self.size = 0;
  self.head = undefined;
  self.tail = -1;
  let _tmp = old_head;
  while (true) {
    const x = _tmp;
    if (x === undefined) {
      return;
    } else {
      const _Some = x;
      const _e = _Some;
      const next_in_chain = _e.next;
      _e.next = undefined;
      _M0MPB3Map20rehash__place__entryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, _e);
      _tmp = next_in_chain;
      continue;
    }
  }
}
function _M0MPB3Map4growGsRP25gaato11tasuki__dom7DomNodeE(self) {
  const old_head = self.head;
  const new_capacity = self.capacity << 1;
  self.entries = $make_array_len_and_init(new_capacity, undefined);
  self.capacity = new_capacity;
  self.capacity_mask = new_capacity - 1 | 0;
  self.grow_at = _M0FPB21calc__grow__threshold(self.capacity);
  self.size = 0;
  self.head = undefined;
  self.tail = -1;
  let _tmp = old_head;
  while (true) {
    const x = _tmp;
    if (x === undefined) {
      return;
    } else {
      const _Some = x;
      const _e = _Some;
      const next_in_chain = _e.next;
      _e.next = undefined;
      _M0MPB3Map20rehash__place__entryGsRP25gaato11tasuki__dom7DomNodeE(self, _e);
      _tmp = next_in_chain;
      continue;
    }
  }
}
function _M0MPB3Map15set__with__hashGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, key, value, hash) {
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      if (self.size >= self.grow_at) {
        _M0MPB3Map4growGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self);
        _tmp = 0;
        _tmp$2 = hash & self.capacity_mask;
        continue;
      }
      const _bind$2 = self.tail;
      const _bind$3 = undefined;
      const entry = new _M0TPB5EntryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(_bind$2, _bind$3, psl, hash, key, value);
      _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, entry);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (_curr_entry.hash === hash && _curr_entry.key === key) {
        _curr_entry.value = value;
        return undefined;
      }
      if (psl > _curr_entry.psl) {
        if (self.size >= self.grow_at) {
          _M0MPB3Map4growGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self);
          _tmp = 0;
          _tmp$2 = hash & self.capacity_mask;
          continue;
        }
        _M0MPB3Map10push__awayGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, _curr_entry);
        const _bind$2 = self.tail;
        const _bind$3 = undefined;
        const entry = new _M0TPB5EntryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(_bind$2, _bind$3, psl, hash, key, value);
        _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, entry);
        return undefined;
      }
      _tmp = psl + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map15set__with__hashGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(self, key, value, hash) {
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      if (self.size >= self.grow_at) {
        _M0MPB3Map4growGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self);
        _tmp = 0;
        _tmp$2 = hash & self.capacity_mask;
        continue;
      }
      const _bind$2 = self.tail;
      const _bind$3 = undefined;
      const entry = new _M0TPB5EntryGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(_bind$2, _bind$3, psl, hash, key, value);
      _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, entry);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (_curr_entry.hash === hash && _curr_entry.key === key) {
        _curr_entry.value = value;
        return undefined;
      }
      if (psl > _curr_entry.psl) {
        if (self.size >= self.grow_at) {
          _M0MPB3Map4growGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self);
          _tmp = 0;
          _tmp$2 = hash & self.capacity_mask;
          continue;
        }
        _M0MPB3Map10push__awayGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, _curr_entry);
        const _bind$2 = self.tail;
        const _bind$3 = undefined;
        const entry = new _M0TPB5EntryGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(_bind$2, _bind$3, psl, hash, key, value);
        _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx, entry);
        return undefined;
      }
      _tmp = psl + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map15set__with__hashGsRP25gaato11tasuki__dom7DomNodeE(self, key, value, hash) {
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      if (self.size >= self.grow_at) {
        _M0MPB3Map4growGsRP25gaato11tasuki__dom7DomNodeE(self);
        _tmp = 0;
        _tmp$2 = hash & self.capacity_mask;
        continue;
      }
      const _bind$2 = self.tail;
      const _bind$3 = undefined;
      const entry = new _M0TPB5EntryGsRP25gaato11tasuki__dom7DomNodeE(_bind$2, _bind$3, psl, hash, key, value);
      _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom7DomNodeE(self, idx, entry);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (_curr_entry.hash === hash && _curr_entry.key === key) {
        _curr_entry.value = value;
        return undefined;
      }
      if (psl > _curr_entry.psl) {
        if (self.size >= self.grow_at) {
          _M0MPB3Map4growGsRP25gaato11tasuki__dom7DomNodeE(self);
          _tmp = 0;
          _tmp$2 = hash & self.capacity_mask;
          continue;
        }
        _M0MPB3Map10push__awayGsRP25gaato11tasuki__dom7DomNodeE(self, idx, _curr_entry);
        const _bind$2 = self.tail;
        const _bind$3 = undefined;
        const entry = new _M0TPB5EntryGsRP25gaato11tasuki__dom7DomNodeE(_bind$2, _bind$3, psl, hash, key, value);
        _M0MPB3Map20add__entry__to__tailGsRP25gaato11tasuki__dom7DomNodeE(self, idx, entry);
        return undefined;
      }
      _tmp = psl + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map3setGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, key, value) {
  _M0MPB3Map15set__with__hashGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, key, value, _M0IPC16string6StringPB4Hash4hash(key));
}
function _M0MPB3Map3setGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(self, key, value) {
  _M0MPB3Map15set__with__hashGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(self, key, value, _M0IPC16string6StringPB4Hash4hash(key));
}
function _M0MPB3Map3setGsRP25gaato11tasuki__dom7DomNodeE(self, key, value) {
  _M0MPB3Map15set__with__hashGsRP25gaato11tasuki__dom7DomNodeE(self, key, value, _M0IPC16string6StringPB4Hash4hash(key));
}
function _M0MPB3Map3MapGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(arr, capacity) {
  const length = arr.end - arr.start | 0;
  let capacity$2;
  if (capacity === undefined) {
    capacity$2 = length === 0 ? 8 : _M0FPB21capacity__for__length(length);
  } else {
    const _Some = capacity;
    const _capacity = _Some;
    capacity$2 = _capacity >= 0 ? _M0FPB21capacity__for__length(_capacity > length ? _capacity : length) : $panic("capacity must be non-negative");
  }
  const m = _M0FPB8new__mapGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(capacity$2);
  const _bind = arr.end - arr.start | 0;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const e = arr.buf[arr.start + _ | 0];
      _M0MPB3Map3setGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(m, e._0, e._1);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return m;
}
function _M0MPB3Map3MapGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(arr, capacity) {
  const length = arr.end - arr.start | 0;
  let capacity$2;
  if (capacity === undefined) {
    capacity$2 = length === 0 ? 8 : _M0FPB21capacity__for__length(length);
  } else {
    const _Some = capacity;
    const _capacity = _Some;
    capacity$2 = _capacity >= 0 ? _M0FPB21capacity__for__length(_capacity > length ? _capacity : length) : $panic("capacity must be non-negative");
  }
  const m = _M0FPB8new__mapGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(capacity$2);
  const _bind = arr.end - arr.start | 0;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const e = arr.buf[arr.start + _ | 0];
      _M0MPB3Map3setGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(m, e._0, e._1);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return m;
}
function _M0MPB3Map3MapGsRP25gaato11tasuki__dom7DomNodeE(arr, capacity) {
  const length = arr.end - arr.start | 0;
  let capacity$2;
  if (capacity === undefined) {
    capacity$2 = length === 0 ? 8 : _M0FPB21capacity__for__length(length);
  } else {
    const _Some = capacity;
    const _capacity = _Some;
    capacity$2 = _capacity >= 0 ? _M0FPB21capacity__for__length(_capacity > length ? _capacity : length) : $panic("capacity must be non-negative");
  }
  const m = _M0FPB8new__mapGsRP25gaato11tasuki__dom7DomNodeE(capacity$2);
  const _bind = arr.end - arr.start | 0;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const e = arr.buf[arr.start + _ | 0];
      _M0MPB3Map3setGsRP25gaato11tasuki__dom7DomNodeE(m, e._0, e._1);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return m;
}
function _M0MPB3Map3getGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, key) {
  const hash = _M0IPC16string6StringPB4Hash4hash(key);
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        return _entry.value;
      }
      if (i > _entry.psl) {
        return undefined;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map3getGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(self, key) {
  const hash = _M0IPC16string6StringPB4Hash4hash(key);
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        return _entry.value;
      }
      if (i > _entry.psl) {
        return undefined;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map3getGsRP25gaato11tasuki__dom7DomNodeE(self, key) {
  const hash = _M0IPC16string6StringPB4Hash4hash(key);
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return _M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4None__;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        return new _M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4Some(_entry.value);
      }
      if (i > _entry.psl) {
        return _M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4None__;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map13remove__entryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, entry) {
  const _bind = entry.prev;
  if (_bind === -1) {
    self.head = entry.next;
  } else {
    const _tmp = self.entries;
    const _p = _bind >>> 0 < _tmp.length ? _tmp[_bind] : $oob();
    let _tmp$2;
    if (_p === undefined) {
      _tmp$2 = $panic();
    } else {
      const _p$2 = _p;
      _tmp$2 = _p$2;
    }
    _tmp$2.next = entry.next;
  }
  const _bind$2 = entry.next;
  if (_bind$2 === undefined) {
    self.tail = entry.prev;
    return;
  } else {
    const _Some = _bind$2;
    const _next = _Some;
    _next.prev = entry.prev;
    return;
  }
}
function _M0MPB3Map13remove__entryGsRP25gaato11tasuki__dom7DomNodeE(self, entry) {
  const _bind = entry.prev;
  if (_bind === -1) {
    self.head = entry.next;
  } else {
    const _tmp = self.entries;
    const _p = _bind >>> 0 < _tmp.length ? _tmp[_bind] : $oob();
    let _tmp$2;
    if (_p === undefined) {
      _tmp$2 = $panic();
    } else {
      const _p$2 = _p;
      _tmp$2 = _p$2;
    }
    _tmp$2.next = entry.next;
  }
  const _bind$2 = entry.next;
  if (_bind$2 === undefined) {
    self.tail = entry.prev;
    return;
  } else {
    const _Some = _bind$2;
    const _next = _Some;
    _next.prev = entry.prev;
    return;
  }
}
function _M0MPB3Map11shift__backGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx) {
  let _tmp = idx;
  while (true) {
    const cur = _tmp;
    const next = cur + 1 & self.capacity_mask;
    _L: {
      const _bind = self.entries[next];
      if (_bind === undefined) {
        break _L;
      } else {
        const _Some = _bind;
        const _x = _Some;
        const _x$2 = _x.psl;
        if (_x$2 === 0) {
          break _L;
        } else {
          _x.psl = _x.psl - 1 | 0;
          _M0MPB3Map10set__entryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, _x, cur);
          _tmp = next;
          continue;
        }
      }
    }
    self.entries[cur] = undefined;
    return;
  }
}
function _M0MPB3Map11shift__backGsRP25gaato11tasuki__dom7DomNodeE(self, idx) {
  let _tmp = idx;
  while (true) {
    const cur = _tmp;
    const next = cur + 1 & self.capacity_mask;
    _L: {
      const _bind = self.entries[next];
      if (_bind === undefined) {
        break _L;
      } else {
        const _Some = _bind;
        const _x = _Some;
        const _x$2 = _x.psl;
        if (_x$2 === 0) {
          break _L;
        } else {
          _x.psl = _x.psl - 1 | 0;
          _M0MPB3Map10set__entryGsRP25gaato11tasuki__dom7DomNodeE(self, _x, cur);
          _tmp = next;
          continue;
        }
      }
    }
    self.entries[cur] = undefined;
    return;
  }
}
function _M0MPB3Map18remove__with__hashGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, key, hash) {
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        _M0MPB3Map13remove__entryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, _entry);
        _M0MPB3Map11shift__backGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, idx);
        self.size = self.size - 1 | 0;
        return;
      }
      if (i > _entry.psl) {
        return;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map18remove__with__hashGsRP25gaato11tasuki__dom7DomNodeE(self, key, hash) {
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        _M0MPB3Map13remove__entryGsRP25gaato11tasuki__dom7DomNodeE(self, _entry);
        _M0MPB3Map11shift__backGsRP25gaato11tasuki__dom7DomNodeE(self, idx);
        self.size = self.size - 1 | 0;
        return;
      }
      if (i > _entry.psl) {
        return;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map6removeGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, key) {
  _M0MPB3Map18remove__with__hashGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self, key, _M0IPC16string6StringPB4Hash4hash(key));
}
function _M0MPB3Map6removeGsRP25gaato11tasuki__dom7DomNodeE(self, key) {
  _M0MPB3Map18remove__with__hashGsRP25gaato11tasuki__dom7DomNodeE(self, key, _M0IPC16string6StringPB4Hash4hash(key));
}
function _M0MPC15array10FixedArray12fill_2einnerGORPB5EntryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEEE(self, value, start, end) {
  const array_length = self.length;
  if (array_length > 0) {
    if (start >= 0 && start < array_length) {
      let length;
      if (end === undefined) {
        length = array_length - start | 0;
      } else {
        const _Some = end;
        const _e = _Some;
        length = _e >= start && _e <= array_length ? _e - start | 0 : $panic();
      }
      self.fill(value, start, start + length);
      return;
    } else {
      $panic();
      return;
    }
  } else {
    return;
  }
}
function _M0MPB3Map5clearGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self) {
  _M0MPC15array10FixedArray12fill_2einnerGORPB5EntryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEEE(self.entries, undefined, 0, undefined);
  self.size = 0;
  self.head = undefined;
  self.tail = -1;
}
function _M0MPB3Map4keysGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self) {
  const curr_entry = new _M0TPB8MutLocalGORPB5EntryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEEE(self.head);
  const len = self.size;
  const remaining = new _M0TPB8MutLocalGiE(len);
  return _M0MPB4Iter3newGsE(() => {
    _L: {
      if (remaining.val > 0) {
        const _bind = curr_entry.val;
        if (_bind === undefined) {
          break _L;
        } else {
          const _Some = _bind;
          const _x = _Some;
          const _key = _x.key;
          const _next = _x.next;
          curr_entry.val = _next;
          remaining.val = remaining.val - 1 | 0;
          return _key;
        }
      } else {
        break _L;
      }
    }
    return undefined;
  }, len);
}
function _M0MPB3Map6valuesGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self) {
  const curr_entry = new _M0TPB8MutLocalGORPB5EntryGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEEE(self.head);
  const len = self.size;
  const remaining = new _M0TPB8MutLocalGiE(len);
  return _M0MPB4Iter3newGsE(() => {
    _L: {
      if (remaining.val > 0) {
        const _bind = curr_entry.val;
        if (_bind === undefined) {
          break _L;
        } else {
          const _Some = _bind;
          const _x = _Some;
          const _value = _x.value;
          const _next = _x.next;
          curr_entry.val = _next;
          remaining.val = remaining.val - 1 | 0;
          return _value;
        }
      } else {
        break _L;
      }
    }
    return undefined;
  }, len);
}
function _M0IPC16string6StringPB4Hash4hash(self) {
  let acc = (_M0FPB4seed >>> 0) + (374761393 >>> 0) | 0;
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      acc = (acc >>> 0) + (4 >>> 0) | 0;
      const v = self.charCodeAt(i);
      acc = _M0FPB13consume4__acc(acc, v);
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0FPB13finalize__acc(acc);
}
function _M0MPC15array12MutArrayView4swapGsE(arr, i, j) {
  const temp = arr.buf[arr.start + i | 0];
  arr.buf[arr.start + i | 0] = arr.buf[arr.start + j | 0];
  arr.buf[arr.start + j | 0] = temp;
}
function _M0MPC15array12MutArrayView5sliceGsE(arr, start, end) {
  const _bind = arr.end - arr.start | 0;
  if (start < 0 || (start > end || end > _bind)) {
    $panic();
  }
  return new _M0TPB12MutArrayViewGsE(arr.buf, start + arr.start | 0, end + arr.start | 0);
}
function _M0MPC15array12MutArrayView14rev__in__placeGsE(arr) {
  const len = arr.end - arr.start | 0;
  const mid_len = len / 2 | 0;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < mid_len) {
      const j = (len - i | 0) - 1 | 0;
      const temp = arr.buf[arr.start + i | 0];
      arr.buf[arr.start + i | 0] = arr.buf[arr.start + j | 0];
      arr.buf[arr.start + j | 0] = temp;
      _tmp = i + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FPB17fixed__get__limit(len) {
  let _tmp = len;
  let _tmp$2 = 0;
  while (true) {
    const len$2 = _tmp;
    const limit = _tmp$2;
    if (len$2 > 0) {
      _tmp = len$2 / 2 | 0;
      _tmp$2 = limit + 1 | 0;
      continue;
    } else {
      return limit;
    }
  }
}
function _M0FPB19fixed__bubble__sortGsE(arr) {
  const _bind = arr.end - arr.start | 0;
  let _tmp = 1;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      let _tmp$2 = i;
      while (true) {
        const j = _tmp$2;
        if (j > 0 && _M0IP016_24default__implPB7Compare6op__gtGsE(arr.buf[arr.start + (j - 1 | 0) | 0], arr.buf[arr.start + j | 0])) {
          _M0MPC15array12MutArrayView4swapGsE(arr, j, j - 1 | 0);
          _tmp$2 = j - 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FPB20fixed__choose__pivotN7sort__2S948GsE(_env, a, b) {
  const arr = _env._1;
  const swaps = _env._0;
  if (_M0IP016_24default__implPB7Compare6op__gtGsE(arr.buf[arr.start + a | 0], arr.buf[arr.start + b | 0])) {
    _M0MPC15array12MutArrayView4swapGsE(arr, a, b);
    swaps.val = swaps.val + 1 | 0;
    return;
  } else {
    return;
  }
}
function _M0FPB20fixed__choose__pivotN7sort__3S949GsE(_env, a, b, c) {
  _M0FPB20fixed__choose__pivotN7sort__2S948GsE(_env, a, b);
  _M0FPB20fixed__choose__pivotN7sort__2S948GsE(_env, b, c);
  _M0FPB20fixed__choose__pivotN7sort__2S948GsE(_env, a, b);
}
function _M0FPB20fixed__choose__pivotGsE(arr) {
  const len = arr.end - arr.start | 0;
  const swaps = new _M0TPB8MutLocalGiE(0);
  const b = Math.imul(len / 4 | 0, 2) | 0;
  if (len >= 8) {
    const a = Math.imul(len / 4 | 0, 1) | 0;
    const c = Math.imul(len / 4 | 0, 3) | 0;
    const _env = { _0: swaps, _1: arr };
    if (len > 50) {
      _M0FPB20fixed__choose__pivotN7sort__3S949GsE(_env, a - 1 | 0, a, a + 1 | 0);
      _M0FPB20fixed__choose__pivotN7sort__3S949GsE(_env, b - 1 | 0, b, b + 1 | 0);
      _M0FPB20fixed__choose__pivotN7sort__3S949GsE(_env, c - 1 | 0, c, c + 1 | 0);
    }
    _M0FPB20fixed__choose__pivotN7sort__3S949GsE(_env, a, b, c);
  }
  if (swaps.val === 12) {
    _M0MPC15array12MutArrayView14rev__in__placeGsE(arr);
    return { _0: (len - b | 0) - 1 | 0, _1: true };
  } else {
    return { _0: b, _1: swaps.val === 0 };
  }
}
function _M0FPB17fixed__sift__downGsE(arr, index) {
  const len = arr.end - arr.start | 0;
  let _tmp = index;
  let _tmp$2 = (Math.imul(index, 2) | 0) + 1 | 0;
  while (true) {
    const index$2 = _tmp;
    const child = _tmp$2;
    if (child < len) {
      const child$2 = (child + 1 | 0) < len && _M0IP016_24default__implPB7Compare6op__ltGsE(arr.buf[arr.start + child | 0], arr.buf[arr.start + (child + 1 | 0) | 0]) ? child + 1 | 0 : child;
      if (_M0IP016_24default__implPB7Compare6op__geGsE(arr.buf[arr.start + index$2 | 0], arr.buf[arr.start + child$2 | 0])) {
        return undefined;
      }
      _M0MPC15array12MutArrayView4swapGsE(arr, index$2, child$2);
      _tmp = child$2;
      _tmp$2 = (Math.imul(child$2, 2) | 0) + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FPB17fixed__heap__sortGsE(arr) {
  const len = arr.end - arr.start | 0;
  const _bind = len / 2 | 0;
  let _tmp = _bind - 1 | 0;
  let _tmp$2 = _bind > 0;
  while (true) {
    const i = _tmp;
    const _more = _tmp$2;
    if (_more) {
      _M0FPB17fixed__sift__downGsE(arr, i);
      _tmp = i - 1 | 0;
      _tmp$2 = i > 0;
      continue;
    } else {
      break;
    }
  }
  let _tmp$3 = len - 1 | 0;
  let _tmp$4 = len > 1;
  while (true) {
    const i = _tmp$3;
    const _more = _tmp$4;
    if (_more) {
      _M0MPC15array12MutArrayView4swapGsE(arr, 0, i);
      _M0FPB17fixed__sift__downGsE(_M0MPC15array12MutArrayView5sliceGsE(arr, 0, i), 0);
      _tmp$3 = i - 1 | 0;
      _tmp$4 = i > 1;
      continue;
    } else {
      return;
    }
  }
}
function _M0FPB16fixed__partitionGsE(arr, pivot_index) {
  _M0MPC15array12MutArrayView4swapGsE(arr, pivot_index, (arr.end - arr.start | 0) - 1 | 0);
  const pivot = arr.buf[arr.start + ((arr.end - arr.start | 0) - 1 | 0) | 0];
  const _bind = (arr.end - arr.start | 0) - 1 | 0;
  let _tmp = 0;
  let _tmp$2 = 0;
  let _tmp$3 = true;
  while (true) {
    const j = _tmp;
    const i = _tmp$2;
    const partitioned = _tmp$3;
    if (j < _bind) {
      if (_M0IP016_24default__implPB7Compare6op__ltGsE(arr.buf[arr.start + j | 0], pivot)) {
        if (i !== j) {
          _M0MPC15array12MutArrayView4swapGsE(arr, i, j);
          _tmp = j + 1 | 0;
          _tmp$2 = i + 1 | 0;
          _tmp$3 = false;
          continue;
        } else {
          _tmp = j + 1 | 0;
          _tmp$2 = i + 1 | 0;
          continue;
        }
      } else {
        _tmp = j + 1 | 0;
        continue;
      }
    } else {
      _M0MPC15array12MutArrayView4swapGsE(arr, i, (arr.end - arr.start | 0) - 1 | 0);
      return { _0: i, _1: partitioned };
    }
  }
}
function _M0FPB24fixed__try__bubble__sortGsE(arr) {
  const _bind = arr.end - arr.start | 0;
  let _tmp = 1;
  let _tmp$2 = 0;
  while (true) {
    const i = _tmp;
    const tries = _tmp$2;
    if (i < _bind) {
      let sorted;
      let _tmp$3 = i;
      let _tmp$4 = true;
      while (true) {
        const j = _tmp$3;
        const sorted$2 = _tmp$4;
        if (j > 0 && _M0IP016_24default__implPB7Compare6op__gtGsE(arr.buf[arr.start + (j - 1 | 0) | 0], arr.buf[arr.start + j | 0])) {
          _M0MPC15array12MutArrayView4swapGsE(arr, j, j - 1 | 0);
          _tmp$3 = j - 1 | 0;
          _tmp$4 = false;
          continue;
        } else {
          sorted = sorted$2;
          break;
        }
      }
      if (!sorted) {
        const tries$2 = tries + 1 | 0;
        if (tries$2 > 8) {
          return false;
        }
        _tmp = i + 1 | 0;
        _tmp$2 = tries$2;
        continue;
      } else {
        _tmp = i + 1 | 0;
        continue;
      }
    } else {
      return true;
    }
  }
}
function _M0FPB18fixed__quick__sortGsE(arr, pred, limit) {
  let _tmp = limit;
  let _tmp$2 = arr;
  let _tmp$3 = pred;
  let _tmp$4 = true;
  let _tmp$5 = true;
  while (true) {
    const limit$2 = _tmp;
    const arr$2 = _tmp$2;
    const pred$2 = _tmp$3;
    const was_partitioned = _tmp$4;
    const balanced = _tmp$5;
    const len = arr$2.end - arr$2.start | 0;
    if (len <= 16) {
      if (len >= 2) {
        _M0FPB19fixed__bubble__sortGsE(arr$2);
      }
      return undefined;
    }
    if (limit$2 === 0) {
      _M0FPB17fixed__heap__sortGsE(arr$2);
      return undefined;
    }
    const _bind = _M0FPB20fixed__choose__pivotGsE(arr$2);
    const _pivot_index = _bind._0;
    const _likely_sorted = _bind._1;
    if (was_partitioned && (balanced && _likely_sorted)) {
      if (_M0FPB24fixed__try__bubble__sortGsE(arr$2)) {
        return undefined;
      }
    }
    const _bind$2 = _M0FPB16fixed__partitionGsE(arr$2, _pivot_index);
    const _pivot = _bind$2._0;
    const _partitioned = _bind$2._1;
    const _p = len - _pivot | 0;
    const balanced$2 = (_pivot > _p ? _p : _pivot) >= (len / 8 | 0);
    const limit$3 = !balanced$2 ? limit$2 - 1 | 0 : limit$2;
    if (pred$2 === undefined) {
    } else {
      const _Some = pred$2;
      const _p$2 = _Some;
      if (_p$2 === arr$2.buf[arr$2.start + _pivot | 0]) {
        let i;
        let _tmp$6 = _pivot;
        while (true) {
          const i$2 = _tmp$6;
          if (i$2 < len && _p$2 === arr$2.buf[arr$2.start + i$2 | 0]) {
            _tmp$6 = i$2 + 1 | 0;
            continue;
          } else {
            i = i$2;
            break;
          }
        }
        _tmp = limit$3;
        _tmp$2 = _M0MPC15array12MutArrayView5sliceGsE(arr$2, i, len);
        _tmp$4 = _partitioned;
        _tmp$5 = balanced$2;
        continue;
      }
    }
    const left = _M0MPC15array12MutArrayView5sliceGsE(arr$2, 0, _pivot);
    const right = _M0MPC15array12MutArrayView5sliceGsE(arr$2, _pivot + 1 | 0, len);
    if ((left.end - left.start | 0) < (right.end - right.start | 0)) {
      _M0FPB18fixed__quick__sortGsE(left, pred$2, limit$3);
      _tmp = limit$3;
      _tmp$2 = right;
      _tmp$3 = arr$2.buf[arr$2.start + _pivot | 0];
      _tmp$4 = _partitioned;
      _tmp$5 = balanced$2;
      continue;
    } else {
      _M0FPB18fixed__quick__sortGsE(right, arr$2.buf[arr$2.start + _pivot | 0], limit$3);
      _tmp = limit$3;
      _tmp$2 = left;
      _tmp$4 = _partitioned;
      _tmp$5 = balanced$2;
      continue;
    }
  }
}
function _M0MPC15array12MutArrayView4sortGsE(self) {
  _M0FPB18fixed__quick__sortGsE(self, undefined, _M0FPB17fixed__get__limit(self.end - self.start | 0));
}
function _M0MPC15array5Array4sortGsE(self) {
  const _bind = self.len;
  _M0MPC15array12MutArrayView4sortGsE(new _M0TPB12MutArrayViewGsE(self.buf, 0, _bind));
}
function _M0FP25gaato6tasuki10go_2einnerGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(next, focus, announce, cmd) {
  return new _M0TP25gaato6tasuki4StepGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(next, focus, announce, cmd);
}
function _M0FP25gaato6tasuki2goGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(next, focus, announce, cmd$46$opt) {
  let cmd;
  if (cmd$46$opt === undefined) {
    cmd = _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE4Done__;
  } else {
    const _Some = cmd$46$opt;
    cmd = _Some;
  }
  return _M0FP25gaato6tasuki10go_2einnerGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(next, focus, announce, cmd);
}
function _M0FP25gaato6tasuki4stayGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(state) {
  return new _M0TP25gaato6tasuki4StepGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(state, _M0DTP25gaato6tasuki5Focus4Keep__, _M0DTP25gaato6tasuki8Announce6Silent__, _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE4Done__);
}
function _M0FP25gaato6tasuki9componentGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(name, init, update, view, tag) {
  return new _M0TP25gaato6tasuki9ComponentGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(name, init, update, view, tag);
}
function _M0MP25gaato6tasuki3Cmd7flattenN2goS1069GRP35gaato6tasuki4demo8ShareMsgE(out, c) {
  switch (c.$tag) {
    case 0: {
      return;
    }
    case 4: {
      const _Batch = c;
      const _cs = _Batch._0;
      const _bind = _cs.len;
      const _bind$2 = _cs.buf;
      let _tmp = 0;
      while (true) {
        const _ = _tmp;
        if (_ < _bind) {
          const c$2 = _bind$2[_];
          _M0MP25gaato6tasuki3Cmd7flattenN2goS1069GRP35gaato6tasuki4demo8ShareMsgE(out, c$2);
          _tmp = _ + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    default: {
      _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(out, c);
      return;
    }
  }
}
function _M0MP25gaato6tasuki3Cmd7flattenGRP35gaato6tasuki4demo8ShareMsgE(self) {
  const out = new _M0TPB5ArrayGRP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgEE([], 0);
  _M0MP25gaato6tasuki3Cmd7flattenN2goS1069GRP35gaato6tasuki4demo8ShareMsgE(out, self);
  return out;
}
function _M0MP25gaato6tasuki3Cmd3keyGRP35gaato6tasuki4demo8ShareMsgE(self) {
  _L: {
    let key;
    _L$2: {
      switch (self.$tag) {
        case 1: {
          const _Request = self;
          const _key = _Request._0;
          key = _key;
          break _L$2;
        }
        case 2: {
          const _Call = self;
          const _key$2 = _Call._0;
          key = _key$2;
          break _L$2;
        }
        case 3: {
          const _After = self;
          const _key$3 = _After._0;
          key = _key$3;
          break _L$2;
        }
        case 0: {
          break _L;
        }
        default: {
          break _L;
        }
      }
    }
    return key;
  }
  return undefined;
}
function _M0FP25gaato6tasuki17valid__attr__name(name) {
  if (name === "") {
    return false;
  }
  const _bind = name.length;
  let _tmp = 0;
  while (true) {
    const _string_index = _tmp;
    if (_string_index < _bind) {
      let _decoded_next_string_index;
      let _decoded_char;
      _L: {
        const _bind$2 = name.charCodeAt(_string_index);
        if (_bind$2 >= 55296 && _bind$2 <= 56319 && (_string_index + 1 | 0) < _bind) {
          const _bind$3 = name.charCodeAt(_string_index + 1 | 0);
          if (_bind$3 >= 56320 && _bind$3 <= 57343) {
            const _tmp$2 = _string_index + 2 | 0;
            const _p = (((Math.imul(_bind$2 - 55296 | 0, 1024) | 0) + _bind$3 | 0) - 56320 | 0) + 65536 | 0;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          } else {
            const _tmp$2 = _string_index + 1 | 0;
            const _p = _bind$2;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          }
        } else {
          const _tmp$2 = _string_index + 1 | 0;
          const _p = _bind$2;
          _decoded_next_string_index = _tmp$2;
          _decoded_char = _p;
          break _L;
        }
      }
      if (!(_decoded_char >= 97 && _decoded_char <= 122 ? true : _decoded_char >= 65 && _decoded_char <= 90 ? true : _decoded_char >= 48 && _decoded_char <= 57 ? true : _decoded_char === 45 ? true : _decoded_char === 95 ? true : _decoded_char === 58)) {
        return false;
      }
      _tmp = _decoded_next_string_index;
      continue;
    } else {
      break;
    }
  }
  return true;
}
function _M0FP25gaato6tasuki14dangerous__url(value) {
  const buf = _M0MPB13StringBuilder21StringBuilder_2einner(8);
  const _bind = value.length;
  let _tmp = 0;
  while (true) {
    const _string_index = _tmp;
    if (_string_index < _bind) {
      let _decoded_next_string_index;
      let _decoded_char;
      _L: {
        const _bind$2 = value.charCodeAt(_string_index);
        if (_bind$2 >= 55296 && _bind$2 <= 56319 && (_string_index + 1 | 0) < _bind) {
          const _bind$3 = value.charCodeAt(_string_index + 1 | 0);
          if (_bind$3 >= 56320 && _bind$3 <= 57343) {
            const _tmp$2 = _string_index + 2 | 0;
            const _p = (((Math.imul(_bind$2 - 55296 | 0, 1024) | 0) + _bind$3 | 0) - 56320 | 0) + 65536 | 0;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          } else {
            const _tmp$2 = _string_index + 1 | 0;
            const _p = _bind$2;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          }
        } else {
          const _tmp$2 = _string_index + 1 | 0;
          const _p = _bind$2;
          _decoded_next_string_index = _tmp$2;
          _decoded_char = _p;
          break _L;
        }
      }
      _L$2: {
        if (_decoded_char <= 32) {
          break _L$2;
        }
        if (_decoded_char === 58) {
          _M0IPB13StringBuilderPB6Logger11write__char(buf, 58);
          break;
        }
        _M0IPB13StringBuilderPB6Logger11write__char(buf, _decoded_char);
        break _L$2;
      }
      _tmp = _decoded_next_string_index;
      continue;
    } else {
      break;
    }
  }
  const scheme = _M0MPC16string6String9to__lower(buf.val);
  switch (scheme) {
    case "javascript:": {
      return true;
    }
    case "vbscript:": {
      return true;
    }
    case "data:": {
      return true;
    }
    default: {
      return false;
    }
  }
}
function _M0FP25gaato6tasuki13attr__allowed(name, value) {
  if (!_M0FP25gaato6tasuki17valid__attr__name(name)) {
    return false;
  }
  const lower = _M0MPC16string6String9to__lower(name);
  if (_M0MPC16string6String11has__prefix(lower, _M0FP25gaato6tasuki13attr__allowedN6recordS1117) || lower === "srcdoc") {
    return false;
  }
  _L: {
    switch (lower) {
      case "href": {
        break _L;
      }
      case "src": {
        break _L;
      }
      case "action": {
        break _L;
      }
      case "formaction": {
        break _L;
      }
      case "xlink:href": {
        break _L;
      }
      case "poster": {
        break _L;
      }
      case "cite": {
        break _L;
      }
      case "background": {
        break _L;
      }
      case "ping": {
        break _L;
      }
      default: {
        return true;
      }
    }
  }
  return !_M0FP25gaato6tasuki14dangerous__url(value);
}
function _M0FP25gaato6tasuki12tag__allowed(tag) {
  const _bind = _M0MPC16string6String9to__lower(tag);
  let _tmp;
  switch (_bind) {
    case "script": {
      _tmp = true;
      break;
    }
    case "iframe": {
      _tmp = true;
      break;
    }
    case "frame": {
      _tmp = true;
      break;
    }
    case "frameset": {
      _tmp = true;
      break;
    }
    case "object": {
      _tmp = true;
      break;
    }
    case "embed": {
      _tmp = true;
      break;
    }
    case "applet": {
      _tmp = true;
      break;
    }
    case "base": {
      _tmp = true;
      break;
    }
    case "meta": {
      _tmp = true;
      break;
    }
    default: {
      _tmp = false;
    }
  }
  return !_tmp;
}
function _M0FP25gaato6tasuki10el_2einnerGRP35gaato6tasuki4demo8ShareMsgE(tag, id, attrs, handlers, children) {
  return new _M0DTP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgE4Elem(new _M0TP25gaato6tasuki4NodeGRP35gaato6tasuki4demo8ShareMsgE(tag, id, attrs, handlers, children));
}
function _M0FP25gaato6tasuki2elGRP35gaato6tasuki4demo8ShareMsgE(tag, id, attrs$46$opt, handlers$46$opt, children) {
  let attrs;
  if (attrs$46$opt === undefined) {
    attrs = new _M0TPB5ArrayGUssEE([], 0);
  } else {
    const _Some = attrs$46$opt;
    attrs = _Some;
  }
  let handlers;
  if (handlers$46$opt === undefined) {
    handlers = new _M0TPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEE([], 0);
  } else {
    const _Some = handlers$46$opt;
    handlers = _Some;
  }
  return _M0FP25gaato6tasuki10el_2einnerGRP35gaato6tasuki4demo8ShareMsgE(tag, id, attrs, handlers, children);
}
function _M0FP25gaato6tasuki13group_2einnerGRP35gaato6tasuki4demo8ShareMsgE(id, attrs, children) {
  return _M0FP25gaato6tasuki2elGRP35gaato6tasuki4demo8ShareMsgE("div", id, attrs, undefined, children);
}
function _M0FP25gaato6tasuki5groupGRP35gaato6tasuki4demo8ShareMsgE(id, attrs$46$opt, children) {
  let attrs;
  if (attrs$46$opt === undefined) {
    attrs = new _M0TPB5ArrayGUssEE([], 0);
  } else {
    const _Some = attrs$46$opt;
    attrs = _Some;
  }
  return _M0FP25gaato6tasuki13group_2einnerGRP35gaato6tasuki4demo8ShareMsgE(id, attrs, children);
}
function _M0FP25gaato6tasuki9paragraphGRP35gaato6tasuki4demo8ShareMsgE(id, class$$, content) {
  let attrs;
  if (class$$ === undefined) {
    attrs = new _M0TPB5ArrayGUssEE([], 0);
  } else {
    const _Some = class$$;
    const _c = _Some;
    attrs = new _M0TPB5ArrayGUssEE([{ _0: "class", _1: _c }], 1);
  }
  return _M0FP25gaato6tasuki2elGRP35gaato6tasuki4demo8ShareMsgE("p", id, attrs, undefined, new _M0TPB5ArrayGRP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgEE([new _M0DTP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgE4Text(content)], 1));
}
function _M0FP25gaato6tasuki13button__attrs(kind, busy, name, described_by, class$$) {
  const attrs = new _M0TPB5ArrayGUssEE([{ _0: "type", _1: kind }, { _0: "aria-disabled", _1: busy ? "true" : "false" }], 2);
  if (class$$ === undefined) {
  } else {
    const _Some = class$$;
    const _c = _Some;
    _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(attrs, { _0: "class", _1: _c });
  }
  if (name === undefined) {
  } else {
    const _Some = name;
    const _n = _Some;
    _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(attrs, { _0: "aria-label", _1: _n });
  }
  if (described_by === undefined) {
  } else {
    const _Some = described_by;
    const _d = _Some;
    _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(attrs, { _0: "aria-describedby", _1: _d });
  }
  return attrs;
}
function _M0FP25gaato6tasuki14button_2einnerGRP35gaato6tasuki4demo8ShareMsgE(id, label, on_click, busy, name, described_by, class$$) {
  return _M0FP25gaato6tasuki10el_2einnerGRP35gaato6tasuki4demo8ShareMsgE("button", id, _M0FP25gaato6tasuki13button__attrs("button", busy, name, described_by, class$$), new _M0TPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEE([new _M0DTP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgE5Click(on_click)], 1), new _M0TPB5ArrayGRP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgEE([new _M0DTP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgE4Text(label)], 1));
}
function _M0FP35gaato6tasuki4demo13share__update(url, texts) {
  return (s, m) => {
    let s$2;
    _L: {
      if (s.$tag === 0) {
        const _Ready = s;
        switch (m.$tag) {
          case 0: {
            const _p = "share";
            const _p$2 = "share";
            const _p$3 = (r) => new _M0DTP35gaato6tasuki4demo8ShareMsg8Finished(r);
            const _p$4 = (e) => new _M0DTP35gaato6tasuki4demo8ShareMsg5Broke(e);
            return _M0FP25gaato6tasuki10go_2einnerGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_M0DTP35gaato6tasuki4demo5Share7Sharing__, _M0DTP25gaato6tasuki5Focus4Keep__, _M0DTP25gaato6tasuki8Announce6Silent__, new _M0DTP25gaato6tasuki3CmdGRP35gaato6tasuki4demo8ShareMsgE4Call(_p, _p$2, url, _p$3, _p$4));
          }
          case 1: {
            s$2 = _Ready;
            break _L;
          }
          default: {
            s$2 = _Ready;
            break _L;
          }
        }
      } else {
        switch (m.$tag) {
          case 1: {
            const _Finished = m;
            const _x = _Finished._0;
            if (_x === "copied") {
              return _M0FP25gaato6tasuki2goGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(new _M0DTP35gaato6tasuki4demo5Share5Ready(texts.copied), _M0DTP25gaato6tasuki5Focus4Keep__, new _M0DTP25gaato6tasuki8Announce6Polite(texts.copied), undefined);
            } else {
              return _M0FP25gaato6tasuki2goGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(new _M0DTP35gaato6tasuki4demo5Share5Ready(undefined), _M0DTP25gaato6tasuki5Focus4Keep__, _M0DTP25gaato6tasuki8Announce6Silent__, undefined);
            }
          }
          case 2: {
            return _M0FP25gaato6tasuki2goGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(new _M0DTP35gaato6tasuki4demo5Share5Ready(texts.failed), _M0DTP25gaato6tasuki5Focus4Keep__, new _M0DTP25gaato6tasuki8Announce9Assertive(texts.failed), undefined);
          }
          default: {
            return _M0FP25gaato6tasuki4stayGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(s);
          }
        }
      }
    }
    return _M0FP25gaato6tasuki4stayGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(s$2);
  };
}
function _M0FP35gaato6tasuki4demo11share__view(texts, s) {
  let said;
  if (s.$tag === 0) {
    const _Ready = s;
    said = _Ready._0;
  } else {
    said = undefined;
  }
  const _tmp = texts.label;
  let _tmp$2;
  if (s.$tag === 1) {
    _tmp$2 = true;
  } else {
    _tmp$2 = false;
  }
  return _M0FP25gaato6tasuki5groupGRP35gaato6tasuki4demo8ShareMsgE(undefined, undefined, new _M0TPB5ArrayGRP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgEE([_M0FP25gaato6tasuki14button_2einnerGRP35gaato6tasuki4demo8ShareMsgE("share", _tmp, _M0DTP35gaato6tasuki4demo8ShareMsg5Press__, _tmp$2, undefined, undefined, texts.button_class), _M0FP25gaato6tasuki9paragraphGRP35gaato6tasuki4demo8ShareMsgE(_M0FP35gaato6tasuki4demo11share__viewN6constrS1182, texts.said_class, _M0MPC16option6Option10unwrap__orGsE(said, ""))], 2));
}
function _M0FP35gaato6tasuki4demo21share__button_2einner(url, texts) {
  return _M0FP25gaato6tasuki9componentGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE("share", new _M0DTP35gaato6tasuki4demo5Share5Ready(undefined), _M0FP35gaato6tasuki4demo13share__update(url, texts), (s) => _M0FP35gaato6tasuki4demo11share__view(texts, s), (s) => {
    if (s.$tag === 0) {
      return "ready";
    } else {
      return "sharing";
    }
  });
}
function _M0FP25gaato11tasuki__dom14plan__childrenGRP35gaato6tasuki4demo8ShareMsgE(parent, children, keyed) {
  const old = _M0FP25gaato11tasuki__dom12child__nodes(parent);
  const _p = new _M0TPB5ArrayGRP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgEE([], 0);
  const _p$2 = children.len;
  const _p$3 = children.buf;
  let renderable;
  let _tmp = 0;
  while (true) {
    const _p$4 = _tmp;
    if (_p$4 < _p$2) {
      const _p$5 = _p$3[_p$4];
      let _tmp$2;
      if (_p$5.$tag === 0) {
        _tmp$2 = true;
      } else {
        const _p$6 = _p$5;
        const _p$7 = _p$6._0;
        _tmp$2 = _M0FP25gaato6tasuki12tag__allowed(_p$7.tag);
      }
      if (_tmp$2) {
        _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(_p, _p$5);
      }
      _tmp = _p$4 + 1 | 0;
      continue;
    } else {
      renderable = _p;
      break;
    }
  }
  if (renderable.len === 0) {
    return new _M0TPB5ArrayGRP25gaato11tasuki__dom9PlacementE([], 0);
  }
  const _p$4 = _M0MPC15array5Array20unsafe__make__uninitGRP25gaato11tasuki__dom9PlacementE(renderable.len);
  const _p$5 = renderable.len;
  const _p$6 = renderable.buf;
  let _tmp$2 = 0;
  while (true) {
    const _p$7 = _tmp$2;
    if (_p$7 < _p$5) {
      const _p$8 = _p$6[_p$7];
      const _p$9 = _p$7 < old.length && _M0FP25gaato11tasuki__dom8node__id(_p$7 >>> 0 < old.length ? old[_p$7] : $oob()) === "" ? new _M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4Some(_p$7 >>> 0 < old.length ? old[_p$7] : $oob()) : _M0DTPC16option6OptionGRP25gaato11tasuki__dom7DomNodeE4None__;
      let _p$10;
      if (_p$8.$tag === 0) {
        const _p$11 = _p$8;
        const _p$12 = _p$11._0;
        let _p$13;
        _L: {
          _L$2: {
            if (_p$9.$tag === 1) {
              const _p$14 = _p$9;
              const _p$15 = _p$14._0;
              if (_M0FP25gaato11tasuki__dom8is__text(_p$15)) {
                _M0FP25gaato11tasuki__dom11patch__text(_p$15, _p$12);
                _p$13 = _p$15;
              } else {
                break _L$2;
              }
            } else {
              break _L$2;
            }
            break _L;
          }
          _p$13 = _M0FP25gaato11tasuki__dom10make__text(_p$12);
        }
        _p$10 = new _M0TP25gaato11tasuki__dom9Placement(_p$13, new _M0TPB5ArrayGRP25gaato11tasuki__dom9PlacementE([], 0));
      } else {
        const _p$11 = _p$8;
        const _p$12 = _p$11._0;
        const _p$13 = _M0MPC16option6Option10unwrap__orGsE(_p$12.id, "");
        const _p$14 = _p$13 === "" ? _p$9 : _M0MPB3Map3getGsRP25gaato11tasuki__dom7DomNodeE(keyed, _p$13);
        let _p$15;
        _L: {
          _L$2: {
            if (_p$14.$tag === 1) {
              const _p$16 = _p$14;
              const _p$17 = _p$16._0;
              if (_M0FP25gaato11tasuki__dom12matches__tag(_p$17, _p$12.tag)) {
                const _p$18 = "";
                if (!(_p$13 === _p$18)) {
                  _M0MPB3Map6removeGsRP25gaato11tasuki__dom7DomNodeE(keyed, _p$13);
                }
                _p$15 = _p$17;
              } else {
                break _L$2;
              }
            } else {
              break _L$2;
            }
            break _L;
          }
          _p$15 = _M0FP25gaato11tasuki__dom13make__element(_p$12.tag);
        }
        const _p$16 = _p$12.attrs;
        const _p$17 = new _M0TPB5ArrayGUssEE([], 0);
        const _p$18 = _p$16.len;
        const _p$19 = _p$16.buf;
        let _p$20;
        let _tmp$3 = 0;
        while (true) {
          const _p$21 = _tmp$3;
          if (_p$21 < _p$18) {
            const _p$22 = _p$19[_p$21];
            if (_M0FP25gaato6tasuki13attr__allowed(_p$22._0, _p$22._1)) {
              _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(_p$17, _p$22);
            }
            _tmp$3 = _p$21 + 1 | 0;
            continue;
          } else {
            _p$20 = _p$17;
            break;
          }
        }
        const _p$21 = _p$20.len;
        let _p$22;
        if (_p$21 <= 0) {
          _p$22 = [];
        } else {
          if (false || 0 >= _p$20.len) {
            $panic();
          }
          const _p$23 = $make_array_len_and_init(_p$21, _p$20.buf[0]._0);
          let _tmp$4 = 1;
          while (true) {
            const _p$24 = _tmp$4;
            if (_p$24 < _p$21) {
              if (_p$24 < 0 || _p$24 >= _p$20.len) {
                $panic();
              }
              if (_p$24 >>> 0 < _p$23.length) {
                _p$23[_p$24] = _p$20.buf[_p$24]._0;
              } else {
                $oob();
              }
              _tmp$4 = _p$24 + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _p$22 = _p$23;
        }
        const _p$23 = _p$20.len;
        let _p$24;
        if (_p$23 <= 0) {
          _p$24 = [];
        } else {
          if (false || 0 >= _p$20.len) {
            $panic();
          }
          const _p$25 = $make_array_len_and_init(_p$23, _p$20.buf[0]._1);
          let _tmp$4 = 1;
          while (true) {
            const _p$26 = _tmp$4;
            if (_p$26 < _p$23) {
              if (_p$26 < 0 || _p$26 >= _p$20.len) {
                $panic();
              }
              if (_p$26 >>> 0 < _p$25.length) {
                _p$25[_p$26] = _p$20.buf[_p$26]._1;
              } else {
                $oob();
              }
              _tmp$4 = _p$26 + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _p$24 = _p$25;
        }
        _M0FP25gaato11tasuki__dom12patch__attrs(_p$15, _p$13, _p$22, _p$24);
        _p$10 = new _M0TP25gaato11tasuki__dom9Placement(_p$15, _M0FP25gaato11tasuki__dom14plan__childrenGRP35gaato6tasuki4demo8ShareMsgE(_p$15, _p$12.children, keyed));
      }
      _p$4.buf[_p$7] = _p$10;
      _tmp$2 = _p$7 + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _p$4;
}
function _M0FP25gaato11tasuki__dom11patch__viewN5placeS1222GRP35gaato6tasuki4demo8ShareMsgE(trimmed, parent, children) {
  _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(trimmed, { _0: parent, _1: children.len });
  const _bind = children.len;
  const _bind$2 = children.buf;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      const child = _bind$2[i];
      _M0FP25gaato11tasuki__dom12place__child(parent, child.node, i);
      _M0FP25gaato11tasuki__dom11patch__viewN5placeS1222GRP35gaato6tasuki4demo8ShareMsgE(trimmed, child.node, child.children);
      _tmp = i + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FP25gaato11tasuki__dom11patch__viewGRP35gaato6tasuki4demo8ShareMsgE(slot, view) {
  const _bind = [];
  const keyed = _M0MPB3Map3MapGsRP25gaato11tasuki__dom7DomNodeE(new _M0TPB9ArrayViewGUsRP25gaato11tasuki__dom7DomNodeEE(_bind, 0, 0), undefined);
  const _bind$2 = _M0FP25gaato11tasuki__dom17identified__nodes(slot);
  const _bind$3 = _bind$2.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind$3) {
      const node = _bind$2[_];
      _M0MPB3Map3setGsRP25gaato11tasuki__dom7DomNodeE(keyed, _M0FP25gaato11tasuki__dom8node__id(node), node);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const plan = _M0FP25gaato11tasuki__dom14plan__childrenGRP35gaato6tasuki4demo8ShareMsgE(slot, new _M0TPB5ArrayGRP25gaato6tasuki4HtmlGRP35gaato6tasuki4demo8ShareMsgEE([view], 1), keyed);
  const trimmed = new _M0TPB5ArrayGURP25gaato11tasuki__dom7DomNodeiEE([], 0);
  _M0FP25gaato11tasuki__dom11patch__viewN5placeS1222GRP35gaato6tasuki4demo8ShareMsgE(trimmed, slot, plan);
  const _bind$4 = trimmed.len;
  const _bind$5 = trimmed.buf;
  let _tmp$2 = 0;
  while (true) {
    const _ = _tmp$2;
    if (_ < _bind$4) {
      const entry = _bind$5[_];
      _M0FP25gaato11tasuki__dom14trim__children(entry._0, entry._1);
      _tmp$2 = _ + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0MP25gaato11tasuki__dom7Effects11cancel__allGRP35gaato6tasuki4demo8ShareMsgE(self) {
  const cancelled = _M0MPB4Iter9to__arrayGsE(_M0MPB3Map6valuesGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self.entries));
  _M0MPB3Map5clearGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self.entries);
  const _bind = cancelled.len;
  const _bind$2 = cancelled.buf;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const effect = _bind$2[_];
      const _func = effect.cancel;
      _func();
      _tmp = _ + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0MP25gaato11tasuki__dom7Effects8completeGRP35gaato6tasuki4demo8ShareMsgE(self, key, generation, outcome) {
  _L: {
    const _bind = _M0MPB3Map3getGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self.entries, key);
    if (_bind === undefined) {
      break _L;
    } else {
      const _Some = _bind;
      const _effect = _Some;
      if (BigInt.asUintN(64, _effect.generation) === BigInt.asUintN(64, generation)) {
        let message;
        _L$2: {
          _L$3: {
            let err;
            let value;
            _L$4: {
              _L$5: {
                let ok;
                let value$2;
                _L$6: {
                  _L$7: {
                    const _bind$2 = _effect.cmd;
                    switch (_bind$2.$tag) {
                      case 1: {
                        const _Request = _bind$2;
                        const _ok = _Request._4;
                        if (outcome.$tag === 0) {
                          const _Succeed = outcome;
                          const _value = _Succeed._0;
                          ok = _ok;
                          value$2 = _value;
                          break _L$7;
                        } else {
                          const _err = _Request._5;
                          if (outcome.$tag === 1) {
                            const _Fail = outcome;
                            const _value = _Fail._0;
                            err = _err;
                            value = _value;
                            break _L$5;
                          } else {
                            break _L$3;
                          }
                        }
                      }
                      case 2: {
                        const _Call = _bind$2;
                        const _ok$2 = _Call._3;
                        if (outcome.$tag === 0) {
                          const _Succeed = outcome;
                          const _value = _Succeed._0;
                          ok = _ok$2;
                          value$2 = _value;
                          break _L$7;
                        } else {
                          const _err = _Call._4;
                          if (outcome.$tag === 1) {
                            const _Fail = outcome;
                            const _value = _Fail._0;
                            err = _err;
                            value = _value;
                            break _L$5;
                          } else {
                            break _L$3;
                          }
                        }
                      }
                      case 3: {
                        const _After = _bind$2;
                        const _msg = _After._2;
                        if (outcome.$tag === 2) {
                          message = () => _msg;
                        } else {
                          break _L$3;
                        }
                        break;
                      }
                      default: {
                        break _L$3;
                      }
                    }
                    break _L$6;
                  }
                  message = () => ok(value$2);
                }
                break _L$4;
              }
              message = () => err(value);
            }
            break _L$2;
          }
          return undefined;
        }
        _M0MPB3Map6removeGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self.entries, key);
        return message();
      } else {
        break _L;
      }
    }
  }
  return undefined;
}
function _M0MP25gaato11tasuki__dom7Effects5beginGRP35gaato6tasuki4demo8ShareMsgE(self, key, cmd) {
  const old = _M0MPB3Map3getGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self.entries, key);
  self.generation = BigInt.asUintN(64, self.generation + 1n);
  const effect = new _M0TP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgE(self.generation, cmd, () => {
  });
  _M0MPB3Map3setGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(self.entries, key, effect);
  if (old === undefined) {
  } else {
    const _Some = old;
    const _old = _Some;
    const _func = _old.cancel;
    _func();
  }
  return effect;
}
function _M0MP25gaato11tasuki__dom7Effects3runN7deliverS1296GRP35gaato6tasuki4demo8ShareMsgE(_env, outcome) {
  const _key = _env._3;
  const self = _env._2;
  const send = _env._1;
  const effect = _env._0;
  const _bind = _M0MP25gaato11tasuki__dom7Effects8completeGRP35gaato6tasuki4demo8ShareMsgE(self, _key, effect.generation, outcome);
  if (_bind === undefined) {
    return;
  } else {
    const _Some = _bind;
    const _msg = _Some;
    send(_msg);
    return;
  }
}
function _M0MP25gaato11tasuki__dom7Effects3runGRP35gaato6tasuki4demo8ShareMsgE(self, cmd, test_mode, send) {
  const _bind = _M0MP25gaato6tasuki3Cmd7flattenGRP35gaato6tasuki4demo8ShareMsgE(cmd);
  const _bind$2 = _bind.len;
  const _bind$3 = _bind.buf;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind$2) {
      const cmd$2 = _bind$3[_];
      _L: {
        const _bind$4 = _M0MP25gaato6tasuki3Cmd3keyGRP35gaato6tasuki4demo8ShareMsgE(cmd$2);
        if (_bind$4 === undefined) {
          break _L;
        } else {
          const _Some = _bind$4;
          const _key = _Some;
          const effect = _M0MP25gaato11tasuki__dom7Effects5beginGRP35gaato6tasuki4demo8ShareMsgE(self, _key, cmd$2);
          if (test_mode) {
            break _L;
          }
          const _env = { _0: effect, _1: send, _2: self, _3: _key };
          let _tmp$2;
          _L$2: {
            _L$3: {
              switch (cmd$2.$tag) {
                case 1: {
                  const _Request = cmd$2;
                  const _verb = _Request._1;
                  const _url = _Request._2;
                  const _body = _Request._3;
                  _tmp$2 = _M0FP25gaato11tasuki__dom7request(_verb, _url, _body, (ok, value) => {
                    _M0MP25gaato11tasuki__dom7Effects3runN7deliverS1296GRP35gaato6tasuki4demo8ShareMsgE(_env, ok ? new _M0DTP25gaato6tasuki7Outcome7Succeed(value) : new _M0DTP25gaato6tasuki7Outcome4Fail(value));
                  });
                  break;
                }
                case 2: {
                  const _Call = cmd$2;
                  const _name = _Call._1;
                  const _arg = _Call._2;
                  _tmp$2 = _M0FP25gaato11tasuki__dom10host__call(_name, _arg, (ok, value) => {
                    _M0MP25gaato11tasuki__dom7Effects3runN7deliverS1296GRP35gaato6tasuki4demo8ShareMsgE(_env, ok ? new _M0DTP25gaato6tasuki7Outcome7Succeed(value) : new _M0DTP25gaato6tasuki7Outcome4Fail(value));
                  });
                  break;
                }
                case 3: {
                  const _After = cmd$2;
                  const _ms = _After._1;
                  _tmp$2 = _M0FP25gaato11tasuki__dom5after(_ms, () => {
                    _M0MP25gaato11tasuki__dom7Effects3runN7deliverS1296GRP35gaato6tasuki4demo8ShareMsgE(_env, _M0DTP25gaato6tasuki7Outcome4Fire__);
                  });
                  break;
                }
                case 0: {
                  break _L$3;
                }
                default: {
                  break _L$3;
                }
              }
              break _L$2;
            }
            _tmp$2 = () => {
            };
          }
          effect.cancel = _tmp$2;
        }
        break _L;
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FP25gaato11tasuki__dom16start__componentN4walkS1336GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(handlers, html) {
  if (html.$tag === 1) {
    const _Elem = html;
    const _node = _Elem._0;
    if (_M0FP25gaato6tasuki12tag__allowed(_node.tag)) {
      const _bind = _node.id;
      if (_bind === undefined) {
      } else {
        const _Some = _bind;
        const _id = _Some;
        const _p = _node.handlers;
        if (!(_p.len === 0)) {
          _M0MPB3Map3setGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(handlers, _id, _node.handlers);
        }
      }
      const _bind$2 = _node.children;
      const _bind$3 = _bind$2.len;
      const _bind$4 = _bind$2.buf;
      let _tmp = 0;
      while (true) {
        const _ = _tmp;
        if (_ < _bind$3) {
          const child = _bind$4[_];
          _M0FP25gaato11tasuki__dom16start__componentN4walkS1336GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(handlers, child);
          _tmp = _ + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    } else {
      return;
    }
  } else {
    return;
  }
}
function _M0FP25gaato11tasuki__dom16start__componentN15index__handlersS1337GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(handlers, view) {
  _M0MPB3Map5clearGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(handlers);
  _M0FP25gaato11tasuki__dom16start__componentN4walkS1336GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(handlers, view);
}
function _M0FP25gaato11tasuki__dom16start__componentN6renderS1338GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_env, view) {
  const slot = _env._3;
  const tag = _env._2;
  const handlers = _env._1;
  const root = _env._0;
  _M0FP25gaato11tasuki__dom16start__componentN15index__handlersS1337GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(handlers, view);
  _M0FP25gaato11tasuki__dom11patch__viewGRP35gaato6tasuki4demo8ShareMsgE(slot, view);
  _M0FP25gaato11tasuki__dom10set__state(root, tag.val);
}
function _M0FP25gaato11tasuki__dom16start__componentN7messageS1339GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(handlers, kind, id, value, checked) {
  const _bind = _M0MPB3Map3getGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(handlers, id);
  if (_bind === undefined) {
    return undefined;
  } else {
    const _Some = _bind;
    const _list = _Some;
    const _bind$2 = _list.len;
    const _bind$3 = _list.buf;
    let _tmp = 0;
    while (true) {
      const _ = _tmp;
      if (_ < _bind$2) {
        const handler = _bind$3[_];
        _L: {
          let msg;
          _L$2: {
            _L$3: {
              switch (kind) {
                case "click": {
                  if (handler.$tag === 0) {
                    const _Click = handler;
                    const _msg = _Click._0;
                    msg = _msg;
                  } else {
                    break _L$3;
                  }
                  break;
                }
                case "submit": {
                  if (handler.$tag === 1) {
                    const _Submit = handler;
                    const _msg = _Submit._0;
                    msg = _msg;
                  } else {
                    break _L$3;
                  }
                  break;
                }
                case "input": {
                  if (handler.$tag === 2) {
                    const _Input = handler;
                    const _f = _Input._0;
                    msg = _f(value);
                  } else {
                    break _L$3;
                  }
                  break;
                }
                case "change": {
                  if (handler.$tag === 3) {
                    const _Toggle = handler;
                    const _f = _Toggle._0;
                    msg = _f(checked);
                  } else {
                    break _L$3;
                  }
                  break;
                }
                default: {
                  break _L$3;
                }
              }
              break _L$2;
            }
            break _L;
          }
          return msg;
        }
        _tmp = _ + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return undefined;
  }
}
function _M0FP25gaato11tasuki__dom16start__componentN7advanceS1340GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_env, msg) {
  const effects = _env._3;
  const component = _env._2;
  const tag = _env._1;
  const state = _env._0;
  const _func = component.update;
  const step = _func(state.val, msg);
  const _func$2 = component.tag;
  const next_tag = _func$2(step.next);
  const _p = tag.val;
  if (!(_p === next_tag)) {
    _M0MP25gaato11tasuki__dom7Effects11cancel__allGRP35gaato6tasuki4demo8ShareMsgE(effects);
  }
  state.val = step.next;
  tag.val = next_tag;
  return step;
}
function _M0FP25gaato11tasuki__dom16start__componentN8announceS1341GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_env, announcement, rendered) {
  const publish = _env._1;
  const record = _env._0;
  let politeness;
  let text;
  _L: {
    switch (announcement.$tag) {
      case 0: {
        politeness = "";
        text = "";
        break _L;
      }
      case 1: {
        const _Polite = announcement;
        const _text = _Polite._0;
        politeness = "polite";
        text = _text;
        break _L;
      }
      default: {
        const _Assertive = announcement;
        const _text$2 = _Assertive._0;
        politeness = "assertive";
        text = _text$2;
        break _L;
      }
    }
  }
  const _p = "";
  if (!(politeness === _p)) {
    publish(politeness, text);
  }
  const _func = record.val;
  _func(rendered, politeness, text);
}
function _M0FP25gaato11tasuki__dom16start__componentGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(component, container, test_mode) {
  const _bind = [];
  const effects = new _M0TP25gaato11tasuki__dom7EffectsGRP35gaato6tasuki4demo8ShareMsgE(_M0MPB3Map3MapGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(new _M0TPB9ArrayViewGUsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEEE(_bind, 0, 0), undefined), 0n);
  const disposed = new _M0TPB8MutLocalGbE(false);
  const mounted = _M0FP25gaato11tasuki__dom5mount(container, component.name, () => {
    disposed.val = true;
    _M0MP25gaato11tasuki__dom7Effects11cancel__allGRP35gaato6tasuki4demo8ShareMsgE(effects);
  });
  const root = _M0FP25gaato11tasuki__dom13mounted__root(mounted);
  const slot = _M0FP25gaato11tasuki__dom10view__slot(root);
  const blocked = (el) => _M0FP25gaato11tasuki__dom15blocked__within(root, el);
  const publish = _M0FP25gaato11tasuki__dom13live__regions(mounted, _M0FP25gaato6tasuki16visually__hidden);
  const _bind$2 = [];
  const handlers = _M0MPB3Map3MapGsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEE(new _M0TPB9ArrayViewGUsRPB5ArrayGRP25gaato6tasuki7HandlerGRP35gaato6tasuki4demo8ShareMsgEEEE(_bind$2, 0, 0), undefined);
  const state = new _M0TPB8MutLocalGRP35gaato6tasuki4demo5ShareE(component.init);
  const _func = component.tag;
  const tag = new _M0TPB8MutLocalGsE(_func(state.val));
  const record = new _M0TPB8MutLocalGWbssEuE((_discard_, _discard_$2, _discard_$3) => {
  });
  const _env = { _0: root, _1: handlers, _2: tag, _3: slot };
  const _env$2 = { _0: state, _1: tag, _2: component, _3: effects };
  const _env$3 = { _0: record, _1: publish };
  const send = (msg) => {
    _M0FP25gaato11tasuki__dom18run__in__container(container, () => {
      if (disposed.val) {
        return undefined;
      }
      const step = _M0FP25gaato11tasuki__dom16start__componentN7advanceS1340GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_env$2, msg);
      const _func$2 = component.view;
      _M0FP25gaato11tasuki__dom16start__componentN6renderS1338GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_env, _func$2(state.val));
      const _bind$3 = step.focus;
      if (_bind$3.$tag === 1) {
        const _To = _bind$3;
        const _id = _To._0;
        _M0FP25gaato11tasuki__dom13focus__within(root, _id);
      }
      _M0FP25gaato11tasuki__dom16start__componentN8announceS1341GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_env$3, step.announce, true);
      _M0MP25gaato11tasuki__dom7Effects3runGRP35gaato6tasuki4demo8ShareMsgE(effects, step.cmd, test_mode, send);
    });
  };
  if (test_mode) {
    record.val = _M0FP25gaato11tasuki__dom19expose__test__hooks(mounted, component.name, () => {
      const keys = _M0MPB4Iter9to__arrayGsE(_M0MPB3Map4keysGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(effects.entries));
      _M0MPC15array5Array4sortGsE(keys);
      return _M0MPC15array10FixedArray5makeiGsE(keys.len, (i) => {
        if (i < 0 || i >= keys.len) {
          $panic();
        }
        return keys.buf[i];
      });
    }, (key, outcome, value) => {
      const _bind$3 = _M0MPB3Map3getGsRP25gaato11tasuki__dom6EffectGRP35gaato6tasuki4demo8ShareMsgEE(effects.entries, key);
      if (_bind$3 === undefined) {
        return false;
      } else {
        const _Some = _bind$3;
        const _effect = _Some;
        let result;
        switch (outcome) {
          case "succeed": {
            result = new _M0DTP25gaato6tasuki7Outcome7Succeed(value);
            break;
          }
          case "fail": {
            result = new _M0DTP25gaato6tasuki7Outcome4Fail(value);
            break;
          }
          case "fire": {
            result = _M0DTP25gaato6tasuki7Outcome4Fire__;
            break;
          }
          default: {
            return false;
          }
        }
        const _bind$4 = _M0MP25gaato11tasuki__dom7Effects8completeGRP35gaato6tasuki4demo8ShareMsgE(effects, key, _effect.generation, result);
        if (_bind$4 === undefined) {
          return false;
        } else {
          const _Some$2 = _bind$4;
          const _msg = _Some$2;
          send(_msg);
          return true;
        }
      }
    });
  }
  const _func$2 = component.view;
  const initial_view = _func$2(state.val);
  _M0FP25gaato11tasuki__dom16start__componentN15index__handlersS1337GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(handlers, initial_view);
  const edits = new _M0TPB5ArrayGRP35gaato6tasuki4demo8ShareMsgE([], 0);
  _M0FP25gaato11tasuki__dom14collect__edits(mounted, slot, blocked, (kind, id, value, checked) => {
    const _bind$3 = _M0FP25gaato11tasuki__dom16start__componentN7messageS1339GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(handlers, kind, id, value, checked);
    if (_bind$3 === undefined) {
      return;
    } else {
      const _Some = _bind$3;
      const _msg = _Some;
      _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(edits, _msg);
      return;
    }
  });
  let initial_focus = undefined;
  const announcements = new _M0TPB5ArrayGRP25gaato6tasuki8AnnounceE([], 0);
  const _bind$3 = edits.len;
  const _bind$4 = edits.buf;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind$3) {
      const msg = _bind$4[_];
      const step = _M0FP25gaato11tasuki__dom16start__componentN7advanceS1340GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_env$2, msg);
      const _bind$5 = step.focus;
      if (_bind$5.$tag === 1) {
        const _To = _bind$5;
        const _id = _To._0;
        initial_focus = _id;
      }
      _M0MPC15array5Array4pushGRP35gaato6tasuki4demo8ShareMsgE(announcements, step.announce);
      _M0MP25gaato11tasuki__dom7Effects3runGRP35gaato6tasuki4demo8ShareMsgE(effects, step.cmd, test_mode, send);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  let _tmp$2;
  if (edits.len === 0) {
    _tmp$2 = initial_view;
  } else {
    const _func$3 = component.view;
    _tmp$2 = _func$3(state.val);
  }
  _M0FP25gaato11tasuki__dom16start__componentN6renderS1338GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_env, _tmp$2);
  const _bind$5 = initial_focus;
  if (_bind$5 === undefined) {
  } else {
    const _Some = _bind$5;
    const _id = _Some;
    _M0FP25gaato11tasuki__dom13focus__within(root, _id);
  }
  const _func$3 = record.val;
  _func$3(true, "", "");
  const _bind$6 = announcements.len;
  const _bind$7 = announcements.buf;
  let _tmp$3 = 0;
  while (true) {
    const _ = _tmp$3;
    if (_ < _bind$6) {
      const announcement = _bind$7[_];
      _M0FP25gaato11tasuki__dom16start__componentN8announceS1341GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_env$3, announcement, false);
      _tmp$3 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  _M0FP25gaato11tasuki__dom8delegate(mounted, slot, blocked, (kind, id, value, checked) => {
    const _bind$8 = _M0FP25gaato11tasuki__dom16start__componentN7messageS1339GRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(handlers, kind, id, value, checked);
    if (_bind$8 === undefined) {
      return false;
    } else {
      const _Some = _bind$8;
      const _msg = _Some;
      send(_msg);
      return true;
    }
  });
}
function _M0FP25gaato11tasuki__dom13start_2einnerGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(component, container_id, test_mode) {
  const container = _M0FP25gaato11tasuki__dom15find__container(container_id);
  _M0FP25gaato11tasuki__dom18run__in__container(container, () => {
    _M0FP25gaato11tasuki__dom16start__componentGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(component, container, test_mode);
  });
}
function _M0FP35gaato16tasuki__examples10lab__share12mount__share(container_id, url, label, copied, failed, button_class, said_class) {
  const texts = new _M0TP35gaato6tasuki4demo10ShareTexts(label, copied, failed, button_class === "" ? undefined : button_class, said_class === "" ? undefined : said_class);
  _M0FP25gaato11tasuki__dom13start_2einnerGRP35gaato6tasuki4demo5ShareRP35gaato6tasuki4demo8ShareMsgE(_M0FP35gaato6tasuki4demo21share__button_2einner(url, texts), container_id, false);
}
export { _M0FP35gaato16tasuki__examples10lab__share12mount__share as mount_share }
