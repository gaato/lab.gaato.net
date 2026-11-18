# tasuki trial

`share.js` is generated from [gaato/tasuki](https://github.com/gaato/tasuki)
(private, working name): the package `examples/web/src/lab_share`, built with
`moon build --target js --release`. It replaces the Svelte share button to try
the framework on a real page:

- every transition of the button says where focus goes and what is announced,
  and `explore` checked every one of them;
- the result ("URL copied", or the failure) is announced from live regions
  that are in the page from the start; the old button inserted its
  `role="status"` element together with the text, which screen readers often
  skip.

To update it, rebuild in the tasuki repository and copy
`_build/js/release/build/gaato/tasuki_examples/lab_share/lab_share.js` here
with the header line.
