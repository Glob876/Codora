# Third-party notices

Generated from Cargo.lock, cargo metadata, package-lock.json and installed package license files.
License texts are preserved without modification under docs/licenses/. Development and platform dependencies are included conservatively.

## License choices

- For Rust dual/triple expressions offering MIT, the MIT option is selected; other AND clauses (BSD-3-Clause, Unicode-3.0) still apply.
- DOMPurify is used under its Apache-2.0 option.
- The frontend runtime dependencies otherwise use permissive MIT/ISC/BSD/Apache/Unlicense terms. No vendor assets are distributed.
- MPL-2.0 packages in the build toolchain (Lightning CSS) are not bundled into the app. Their license notices and exact package source URLs are nevertheless retained.
- Mermaid 11.17.2 is selected instead of the 12.x ELK-containing distribution, avoiding the EPL-licensed optional runtime in this build.
- Electron runtime includes Chromium, Node and FFmpeg under their individual licenses; the complete bundled LICENSES.chromium.html is retained. See docs/licensing.md for distribution limitations.
- The build-only @electron-internal/extract-zip 1.0.5 omits the full BSD grant upstream; its README declaration is retained. This documented exception needs resolution before public source-archive distribution (docs/licensing.md).
- khroma omits its manifest license field; its distributed license file explicitly grants MIT.

| Ecosystem | Package | License | Scope | Notices |
| --- | --- | --- | --- | --- |
| cargo | aho-corasick 1.1.5 | Unlicense OR MIT | runtime/platform or Rust test dependency | [COPYING](docs/licenses/cargo-aho-corasick-1.1.5-COPYING), [LICENSE-MIT](docs/licenses/cargo-aho-corasick-1.1.5-LICENSE-MIT) |
| cargo | allocator-api2 0.2.21 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-allocator-api2-0.2.21-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-allocator-api2-0.2.21-LICENSE-MIT) |
| cargo | atomic-waker 1.1.2 | Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-atomic-waker-1.1.2-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-atomic-waker-1.1.2-LICENSE-MIT), [LICENSE-THIRD-PARTY](docs/licenses/cargo-atomic-waker-1.1.2-LICENSE-THIRD-PARTY) |
| cargo | axum 0.8.9 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-axum-0.8.9-LICENSE) |
| cargo | axum-core 0.5.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-axum-core-0.5.6-LICENSE) |
| cargo | base64 0.22.1 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-base64-0.22.1-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-base64-0.22.1-LICENSE-MIT) |
| cargo | bitflags 2.13.2 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-bitflags-2.13.2-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-bitflags-2.13.2-LICENSE-MIT) |
| cargo | block-buffer 0.10.4 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-block-buffer-0.10.4-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-block-buffer-0.10.4-LICENSE-MIT) |
| cargo | block-buffer 0.12.1 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-block-buffer-0.12.1-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-block-buffer-0.12.1-LICENSE-MIT) |
| cargo | bumpalo 3.20.3 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-bumpalo-3.20.3-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-bumpalo-3.20.3-LICENSE-MIT) |
| cargo | bytes 1.12.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-bytes-1.12.1-LICENSE) |
| cargo | cassowary 0.3.0 | MIT / Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-cassowary-0.3.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-cassowary-0.3.0-LICENSE-MIT) |
| cargo | castaway 0.2.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-castaway-0.2.4-LICENSE) |
| cargo | cfg-if 1.0.5 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-cfg-if-1.0.5-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-cfg-if-1.0.5-LICENSE-MIT) |
| cargo | compact_str 0.8.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-compact_str-0.8.2-LICENSE) |
| cargo | const-oid 0.10.2 | Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-const-oid-0.10.2-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-const-oid-0.10.2-LICENSE-MIT) |
| cargo | cpufeatures 0.2.17 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-cpufeatures-0.2.17-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-cpufeatures-0.2.17-LICENSE-MIT) |
| cargo | cpufeatures 0.3.1 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-cpufeatures-0.3.1-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-cpufeatures-0.3.1-LICENSE-MIT) |
| cargo | crossterm 0.28.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-crossterm-0.28.1-LICENSE) |
| cargo | crossterm_winapi 0.9.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-crossterm_winapi-0.9.1-LICENSE) |
| cargo | crypto-common 0.1.7 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-crypto-common-0.1.7-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-crypto-common-0.1.7-LICENSE-MIT) |
| cargo | crypto-common 0.2.2 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-crypto-common-0.2.2-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-crypto-common-0.2.2-LICENSE-MIT) |
| cargo | darling 0.24.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-darling-0.24.1-LICENSE) |
| cargo | darling_core 0.24.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-darling_core-0.24.1-LICENSE) |
| cargo | darling_macro 0.24.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-darling_macro-0.24.1-LICENSE) |
| cargo | digest 0.10.7 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-digest-0.10.7-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-digest-0.10.7-LICENSE-MIT) |
| cargo | digest 0.11.3 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-digest-0.11.3-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-digest-0.11.3-LICENSE-MIT) |
| cargo | either 1.19.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-either-1.19.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-either-1.19.0-LICENSE-MIT) |
| cargo | equivalent 1.0.3 | Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-equivalent-1.0.3-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-equivalent-1.0.3-LICENSE-MIT) |
| cargo | errno 0.3.14 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-errno-0.3.14-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-errno-0.3.14-LICENSE-MIT) |
| cargo | fastrand 2.5.0 | Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-fastrand-2.5.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-fastrand-2.5.0-LICENSE-MIT) |
| cargo | foldhash 0.1.5 | Zlib | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-foldhash-0.1.5-LICENSE) |
| cargo | form_urlencoded 1.2.2 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-form_urlencoded-1.2.2-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-form_urlencoded-1.2.2-LICENSE-MIT) |
| cargo | futures-core 0.3.34 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-futures-core-0.3.34-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-futures-core-0.3.34-LICENSE-MIT) |
| cargo | futures-task 0.3.34 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-futures-task-0.3.34-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-futures-task-0.3.34-LICENSE-MIT) |
| cargo | futures-util 0.3.34 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-futures-util-0.3.34-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-futures-util-0.3.34-LICENSE-MIT) |
| cargo | generic-array 0.14.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-generic-array-0.14.7-LICENSE) |
| cargo | getopts 0.2.24 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-getopts-0.2.24-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-getopts-0.2.24-LICENSE-MIT) |
| cargo | getrandom 0.4.3 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-getrandom-0.4.3-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-getrandom-0.4.3-LICENSE-MIT) |
| cargo | hashbrown 0.15.5 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-hashbrown-0.15.5-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-hashbrown-0.15.5-LICENSE-MIT) |
| cargo | hashbrown 0.17.1 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-hashbrown-0.17.1-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-hashbrown-0.17.1-LICENSE-MIT) |
| cargo | heck 0.5.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-heck-0.5.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-heck-0.5.0-LICENSE-MIT) |
| cargo | hex 0.4.3 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-hex-0.4.3-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-hex-0.4.3-LICENSE-MIT) |
| cargo | http 1.5.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-http-1.5.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-http-1.5.0-LICENSE-MIT) |
| cargo | http-body 1.1.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-http-body-1.1.0-LICENSE) |
| cargo | http-body-util 0.1.5 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-http-body-util-0.1.5-LICENSE) |
| cargo | httparse 1.10.1 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-httparse-1.10.1-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-httparse-1.10.1-LICENSE-MIT) |
| cargo | httpdate 1.0.3 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-httpdate-1.0.3-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-httpdate-1.0.3-LICENSE-MIT) |
| cargo | hybrid-array 0.4.15 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-hybrid-array-0.4.15-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-hybrid-array-0.4.15-LICENSE-MIT) |
| cargo | hyper 1.12.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-hyper-1.12.0-LICENSE) |
| cargo | hyper-util 0.1.21 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-hyper-util-0.1.21-LICENSE) |
| cargo | ident_case 1.0.1 | MIT/Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-ident_case-1.0.1-LICENSE) |
| cargo | indexmap 2.14.0 | Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-indexmap-2.14.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-indexmap-2.14.0-LICENSE-MIT) |
| cargo | indoc 2.0.8 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-indoc-2.0.8-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-indoc-2.0.8-LICENSE-MIT) |
| cargo | instability 0.3.14 | MIT | runtime/platform or Rust test dependency | [LICENSE.md](docs/licenses/cargo-instability-0.3.14-LICENSE.md) |
| cargo | itertools 0.13.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-itertools-0.13.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-itertools-0.13.0-LICENSE-MIT) |
| cargo | itoa 1.0.18 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-itoa-1.0.18-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-itoa-1.0.18-LICENSE-MIT) |
| cargo | js-sys 0.3.106 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-js-sys-0.3.106-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-js-sys-0.3.106-LICENSE-MIT) |
| cargo | libc 0.2.191 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-libc-0.2.191-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-libc-0.2.191-LICENSE-MIT) |
| cargo | linux-raw-sys 0.12.1 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [COPYRIGHT](docs/licenses/cargo-linux-raw-sys-0.12.1-COPYRIGHT), [LICENSE-APACHE](docs/licenses/cargo-linux-raw-sys-0.12.1-LICENSE-APACHE), [LICENSE-Apache-2.0_WITH_LLVM-exception](docs/licenses/cargo-linux-raw-sys-0.12.1-LICENSE-Apache-2.0_WITH_LLVM-exception), [LICENSE-MIT](docs/licenses/cargo-linux-raw-sys-0.12.1-LICENSE-MIT) |
| cargo | linux-raw-sys 0.4.15 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [COPYRIGHT](docs/licenses/cargo-linux-raw-sys-0.4.15-COPYRIGHT), [LICENSE-APACHE](docs/licenses/cargo-linux-raw-sys-0.4.15-LICENSE-APACHE), [LICENSE-Apache-2.0_WITH_LLVM-exception](docs/licenses/cargo-linux-raw-sys-0.4.15-LICENSE-Apache-2.0_WITH_LLVM-exception), [LICENSE-MIT](docs/licenses/cargo-linux-raw-sys-0.4.15-LICENSE-MIT) |
| cargo | lock_api 0.4.14 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-lock_api-0.4.14-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-lock_api-0.4.14-LICENSE-MIT) |
| cargo | log 0.4.34 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-log-0.4.34-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-log-0.4.34-LICENSE-MIT) |
| cargo | lru 0.12.5 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-lru-0.12.5-LICENSE) |
| cargo | matchit 0.8.4 | MIT AND BSD-3-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-matchit-0.8.4-LICENSE), [LICENSE.httprouter](docs/licenses/cargo-matchit-0.8.4-LICENSE.httprouter) |
| cargo | memchr 2.8.3 | Unlicense OR MIT | runtime/platform or Rust test dependency | [COPYING](docs/licenses/cargo-memchr-2.8.3-COPYING), [LICENSE-MIT](docs/licenses/cargo-memchr-2.8.3-LICENSE-MIT) |
| cargo | mime 0.3.17 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-mime-0.3.17-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-mime-0.3.17-LICENSE-MIT) |
| cargo | mime_guess 2.0.5 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-mime_guess-2.0.5-LICENSE) |
| cargo | mio 1.2.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-mio-1.2.4-LICENSE) |
| cargo | once_cell 1.21.4 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-once_cell-1.21.4-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-once_cell-1.21.4-LICENSE-MIT) |
| cargo | parking_lot 0.12.5 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-parking_lot-0.12.5-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-parking_lot-0.12.5-LICENSE-MIT) |
| cargo | parking_lot_core 0.9.12 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-parking_lot_core-0.9.12-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-parking_lot_core-0.9.12-LICENSE-MIT) |
| cargo | paste 1.0.15 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-paste-1.0.15-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-paste-1.0.15-LICENSE-MIT) |
| cargo | percent-encoding 2.3.2 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-percent-encoding-2.3.2-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-percent-encoding-2.3.2-LICENSE-MIT) |
| cargo | pin-project-lite 0.2.17 | Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-pin-project-lite-0.2.17-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-pin-project-lite-0.2.17-LICENSE-MIT) |
| cargo | proc-macro2 1.0.107 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-proc-macro2-1.0.107-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-proc-macro2-1.0.107-LICENSE-MIT) |
| cargo | pulldown-cmark 0.13.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-pulldown-cmark-0.13.0-LICENSE) |
| cargo | pulldown-cmark-escape 0.11.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-pulldown-cmark-escape-0.11.0-LICENSE) |
| cargo | quote 1.0.47 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-quote-1.0.47-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-quote-1.0.47-LICENSE-MIT) |
| cargo | r-efi 6.0.0 | MIT OR Apache-2.0 OR LGPL-2.1-or-later | runtime/platform or Rust test dependency | [AUTHORS](docs/licenses/cargo-r-efi-6.0.0-AUTHORS) |
| cargo | ratatui 0.29.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-ratatui-0.29.0-LICENSE) |
| cargo | redox_syscall 0.5.18 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-redox_syscall-0.5.18-LICENSE) |
| cargo | regex 1.13.1 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-regex-1.13.1-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-regex-1.13.1-LICENSE-MIT) |
| cargo | regex-automata 0.4.18 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-regex-automata-0.4.18-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-regex-automata-0.4.18-LICENSE-MIT) |
| cargo | regex-syntax 0.8.11 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-regex-syntax-0.8.11-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-regex-syntax-0.8.11-LICENSE-MIT) |
| cargo | rust-embed 8.13.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-rust-embed-8.13.0-LICENSE) |
| cargo | rust-embed-impl 8.13.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-rust-embed-impl-8.13.0-LICENSE) |
| cargo | rust-embed-utils 8.13.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-rust-embed-utils-8.13.0-LICENSE) |
| cargo | rustix 0.38.44 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [COPYRIGHT](docs/licenses/cargo-rustix-0.38.44-COPYRIGHT), [LICENSE-APACHE](docs/licenses/cargo-rustix-0.38.44-LICENSE-APACHE), [LICENSE-Apache-2.0_WITH_LLVM-exception](docs/licenses/cargo-rustix-0.38.44-LICENSE-Apache-2.0_WITH_LLVM-exception), [LICENSE-MIT](docs/licenses/cargo-rustix-0.38.44-LICENSE-MIT) |
| cargo | rustix 1.1.5 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [COPYRIGHT](docs/licenses/cargo-rustix-1.1.5-COPYRIGHT), [LICENSE-APACHE](docs/licenses/cargo-rustix-1.1.5-LICENSE-APACHE), [LICENSE-Apache-2.0_WITH_LLVM-exception](docs/licenses/cargo-rustix-1.1.5-LICENSE-Apache-2.0_WITH_LLVM-exception), [LICENSE-MIT](docs/licenses/cargo-rustix-1.1.5-LICENSE-MIT) |
| cargo | rustversion 1.0.23 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-rustversion-1.0.23-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-rustversion-1.0.23-LICENSE-MIT) |
| cargo | ryu 1.0.23 | Apache-2.0 OR BSL-1.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-ryu-1.0.23-LICENSE-APACHE), [LICENSE-BOOST](docs/licenses/cargo-ryu-1.0.23-LICENSE-BOOST) |
| cargo | same-file 1.0.6 | Unlicense/MIT | runtime/platform or Rust test dependency | [COPYING](docs/licenses/cargo-same-file-1.0.6-COPYING), [LICENSE-MIT](docs/licenses/cargo-same-file-1.0.6-LICENSE-MIT) |
| cargo | scopeguard 1.2.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-scopeguard-1.2.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-scopeguard-1.2.0-LICENSE-MIT) |
| cargo | serde 1.0.229 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-serde-1.0.229-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-serde-1.0.229-LICENSE-MIT) |
| cargo | serde_core 1.0.229 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-serde_core-1.0.229-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-serde_core-1.0.229-LICENSE-MIT) |
| cargo | serde_derive 1.0.229 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-serde_derive-1.0.229-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-serde_derive-1.0.229-LICENSE-MIT) |
| cargo | serde_json 1.0.154 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-serde_json-1.0.154-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-serde_json-1.0.154-LICENSE-MIT) |
| cargo | serde_path_to_error 0.1.20 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-serde_path_to_error-0.1.20-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-serde_path_to_error-0.1.20-LICENSE-MIT) |
| cargo | serde_spanned 0.6.9 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-serde_spanned-0.6.9-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-serde_spanned-0.6.9-LICENSE-MIT) |
| cargo | serde_urlencoded 0.7.1 | MIT/Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-serde_urlencoded-0.7.1-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-serde_urlencoded-0.7.1-LICENSE-MIT) |
| cargo | sha2 0.10.9 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-sha2-0.10.9-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-sha2-0.10.9-LICENSE-MIT) |
| cargo | sha2 0.11.1 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-sha2-0.11.1-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-sha2-0.11.1-LICENSE-MIT) |
| cargo | signal-hook 0.3.18 | Apache-2.0/MIT | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-signal-hook-0.3.18-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-signal-hook-0.3.18-LICENSE-MIT) |
| cargo | signal-hook-mio 0.2.5 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-signal-hook-mio-0.2.5-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-signal-hook-mio-0.2.5-LICENSE-MIT) |
| cargo | signal-hook-registry 1.4.8 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-signal-hook-registry-1.4.8-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-signal-hook-registry-1.4.8-LICENSE-MIT) |
| cargo | slab 0.4.12 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-slab-0.4.12-LICENSE) |
| cargo | smallvec 1.16.3 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-smallvec-1.16.3-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-smallvec-1.16.3-LICENSE-MIT) |
| cargo | socket2 0.6.5 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-socket2-0.6.5-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-socket2-0.6.5-LICENSE-MIT) |
| cargo | static_assertions 1.1.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-static_assertions-1.1.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-static_assertions-1.1.0-LICENSE-MIT) |
| cargo | strsim 0.11.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-strsim-0.11.1-LICENSE) |
| cargo | strum 0.26.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-strum-0.26.3-LICENSE) |
| cargo | strum_macros 0.26.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-strum_macros-0.26.4-LICENSE) |
| cargo | syn 2.0.119 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-syn-2.0.119-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-syn-2.0.119-LICENSE-MIT) |
| cargo | syn 3.0.9 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-syn-3.0.9-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-syn-3.0.9-LICENSE-MIT) |
| cargo | sync_wrapper 1.0.2 | Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-sync_wrapper-1.0.2-LICENSE) |
| cargo | tempfile 3.27.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-tempfile-3.27.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-tempfile-3.27.0-LICENSE-MIT) |
| cargo | tokio 1.53.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-tokio-1.53.3-LICENSE) |
| cargo | tokio-macros 2.7.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-tokio-macros-2.7.2-LICENSE) |
| cargo | toml 0.8.23 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-toml-0.8.23-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-toml-0.8.23-LICENSE-MIT) |
| cargo | toml_datetime 0.6.11 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-toml_datetime-0.6.11-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-toml_datetime-0.6.11-LICENSE-MIT) |
| cargo | toml_edit 0.22.27 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-toml_edit-0.22.27-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-toml_edit-0.22.27-LICENSE-MIT) |
| cargo | toml_write 0.1.2 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-toml_write-0.1.2-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-toml_write-0.1.2-LICENSE-MIT) |
| cargo | tower 0.5.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-tower-0.5.3-LICENSE) |
| cargo | tower-layer 0.3.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-tower-layer-0.3.3-LICENSE) |
| cargo | tower-service 0.3.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-tower-service-0.3.3-LICENSE) |
| cargo | tracing 0.1.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-tracing-0.1.44-LICENSE) |
| cargo | tracing-core 0.1.36 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-tracing-core-0.1.36-LICENSE) |
| cargo | tui-textarea 0.7.0 | MIT | runtime/platform or Rust test dependency | [LICENSE.txt](docs/licenses/cargo-tui-textarea-0.7.0-LICENSE.txt) |
| cargo | typenum 1.20.1 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/cargo-typenum-1.20.1-LICENSE), [LICENSE-APACHE](docs/licenses/cargo-typenum-1.20.1-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-typenum-1.20.1-LICENSE-MIT) |
| cargo | unicase 2.10.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-unicase-2.10.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-unicase-2.10.0-LICENSE-MIT) |
| cargo | unicode-ident 1.0.27 | (MIT OR Apache-2.0) AND Unicode-3.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-unicode-ident-1.0.27-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-unicode-ident-1.0.27-LICENSE-MIT), [LICENSE-UNICODE](docs/licenses/cargo-unicode-ident-1.0.27-LICENSE-UNICODE) |
| cargo | unicode-segmentation 1.13.3 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [COPYRIGHT](docs/licenses/cargo-unicode-segmentation-1.13.3-COPYRIGHT), [LICENSE-APACHE](docs/licenses/cargo-unicode-segmentation-1.13.3-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-unicode-segmentation-1.13.3-LICENSE-MIT) |
| cargo | unicode-truncate 1.1.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [COPYRIGHT](docs/licenses/cargo-unicode-truncate-1.1.0-COPYRIGHT), [LICENSE-APACHE](docs/licenses/cargo-unicode-truncate-1.1.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-unicode-truncate-1.1.0-LICENSE-MIT) |
| cargo | unicode-width 0.1.14 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [COPYRIGHT](docs/licenses/cargo-unicode-width-0.1.14-COPYRIGHT), [LICENSE-APACHE](docs/licenses/cargo-unicode-width-0.1.14-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-unicode-width-0.1.14-LICENSE-MIT) |
| cargo | unicode-width 0.2.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [COPYRIGHT](docs/licenses/cargo-unicode-width-0.2.0-COPYRIGHT), [LICENSE-APACHE](docs/licenses/cargo-unicode-width-0.2.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-unicode-width-0.2.0-LICENSE-MIT) |
| cargo | uuid 1.28.0 | Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-uuid-1.28.0-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-uuid-1.28.0-LICENSE-MIT) |
| cargo | version_check 0.9.5 | MIT/Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-version_check-0.9.5-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-version_check-0.9.5-LICENSE-MIT) |
| cargo | walkdir 2.5.0 | Unlicense/MIT | runtime/platform or Rust test dependency | [COPYING](docs/licenses/cargo-walkdir-2.5.0-COPYING), [LICENSE-MIT](docs/licenses/cargo-walkdir-2.5.0-LICENSE-MIT) |
| cargo | wasi 0.11.1+wasi-snapshot-preview1 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT | runtime/platform or Rust test dependency | [cargo-wasi-0.11.1_wasi-snapshot-preview1-LICENSE-APACHE](docs/licenses/cargo-wasi-0.11.1_wasi-snapshot-preview1-LICENSE-APACHE), [cargo-wasi-0.11.1_wasi-snapshot-preview1-LICENSE-Apache-2.0_WITH_LLVM-exception](docs/licenses/cargo-wasi-0.11.1_wasi-snapshot-preview1-LICENSE-Apache-2.0_WITH_LLVM-exception), [cargo-wasi-0.11.1_wasi-snapshot-preview1-LICENSE-MIT](docs/licenses/cargo-wasi-0.11.1_wasi-snapshot-preview1-LICENSE-MIT) |
| cargo | wasm-bindgen 0.2.129 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-wasm-bindgen-0.2.129-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-wasm-bindgen-0.2.129-LICENSE-MIT) |
| cargo | wasm-bindgen-macro 0.2.129 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-wasm-bindgen-macro-0.2.129-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-wasm-bindgen-macro-0.2.129-LICENSE-MIT) |
| cargo | wasm-bindgen-macro-support 0.2.129 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-wasm-bindgen-macro-support-0.2.129-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-wasm-bindgen-macro-support-0.2.129-LICENSE-MIT) |
| cargo | wasm-bindgen-shared 0.2.129 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-wasm-bindgen-shared-0.2.129-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-wasm-bindgen-shared-0.2.129-LICENSE-MIT) |
| cargo | winapi 0.3.9 | MIT/Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-APACHE](docs/licenses/cargo-winapi-0.3.9-LICENSE-APACHE), [LICENSE-MIT](docs/licenses/cargo-winapi-0.3.9-LICENSE-MIT) |
| cargo | winapi-i686-pc-windows-gnu 0.4.0 | MIT/Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-MIT](docs/licenses/cargo-winapi-i686-pc-windows-gnu-0.4.0-LICENSE-MIT), [LICENSE-APACHE](docs/licenses/cargo-winapi-i686-pc-windows-gnu-0.4.0-LICENSE-APACHE) |
| cargo | winapi-util 0.1.11 | Unlicense OR MIT | runtime/platform or Rust test dependency | [COPYING](docs/licenses/cargo-winapi-util-0.1.11-COPYING), [LICENSE-MIT](docs/licenses/cargo-winapi-util-0.1.11-LICENSE-MIT) |
| cargo | winapi-x86_64-pc-windows-gnu 0.4.0 | MIT/Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE-MIT](docs/licenses/cargo-winapi-x86_64-pc-windows-gnu-0.4.0-LICENSE-MIT), [LICENSE-APACHE](docs/licenses/cargo-winapi-x86_64-pc-windows-gnu-0.4.0-LICENSE-APACHE) |
| cargo | windows-link 0.2.1 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows-link-0.2.1-license-apache-2.0), [license-mit](docs/licenses/cargo-windows-link-0.2.1-license-mit) |
| cargo | windows-sys 0.59.0 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows-sys-0.59.0-license-apache-2.0), [license-mit](docs/licenses/cargo-windows-sys-0.59.0-license-mit) |
| cargo | windows-sys 0.61.2 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows-sys-0.61.2-license-apache-2.0), [license-mit](docs/licenses/cargo-windows-sys-0.61.2-license-mit) |
| cargo | windows-targets 0.52.6 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows-targets-0.52.6-license-apache-2.0), [license-mit](docs/licenses/cargo-windows-targets-0.52.6-license-mit) |
| cargo | windows_aarch64_gnullvm 0.52.6 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows_aarch64_gnullvm-0.52.6-license-apache-2.0), [license-mit](docs/licenses/cargo-windows_aarch64_gnullvm-0.52.6-license-mit) |
| cargo | windows_aarch64_msvc 0.52.6 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows_aarch64_msvc-0.52.6-license-apache-2.0), [license-mit](docs/licenses/cargo-windows_aarch64_msvc-0.52.6-license-mit) |
| cargo | windows_i686_gnu 0.52.6 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows_i686_gnu-0.52.6-license-apache-2.0), [license-mit](docs/licenses/cargo-windows_i686_gnu-0.52.6-license-mit) |
| cargo | windows_i686_gnullvm 0.52.6 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows_i686_gnullvm-0.52.6-license-apache-2.0), [license-mit](docs/licenses/cargo-windows_i686_gnullvm-0.52.6-license-mit) |
| cargo | windows_i686_msvc 0.52.6 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows_i686_msvc-0.52.6-license-apache-2.0), [license-mit](docs/licenses/cargo-windows_i686_msvc-0.52.6-license-mit) |
| cargo | windows_x86_64_gnu 0.52.6 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows_x86_64_gnu-0.52.6-license-apache-2.0), [license-mit](docs/licenses/cargo-windows_x86_64_gnu-0.52.6-license-mit) |
| cargo | windows_x86_64_gnullvm 0.52.6 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows_x86_64_gnullvm-0.52.6-license-apache-2.0), [license-mit](docs/licenses/cargo-windows_x86_64_gnullvm-0.52.6-license-mit) |
| cargo | windows_x86_64_msvc 0.52.6 | MIT OR Apache-2.0 | runtime/platform or Rust test dependency | [license-apache-2.0](docs/licenses/cargo-windows_x86_64_msvc-0.52.6-license-apache-2.0), [license-mit](docs/licenses/cargo-windows_x86_64_msvc-0.52.6-license-mit) |
| cargo | winnow 0.7.13 | MIT | runtime/platform or Rust test dependency | [LICENSE-MIT](docs/licenses/cargo-winnow-0.7.13-LICENSE-MIT) |
| cargo | zmij 1.0.23 | MIT | runtime/platform or Rust test dependency | [LICENSE-MIT](docs/licenses/cargo-zmij-1.0.23-LICENSE-MIT) |
| electron-runtime | electron 44.9.0 | MIT AND LicenseRef-Chromium-ThirdParty | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/electron-runtime-electron-44.9.0-LICENSE), [LICENSES.chromium.html](docs/licenses/electron-runtime-electron-44.9.0-LICENSES.chromium.html) |
| npm | @antfu/install-pkg 2.1.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_antfu_install-pkg-2.1.0-LICENSE) |
| npm | @asamuzakjp/css-color 7.1.7 | MIT | build/test | [LICENSE](docs/licenses/npm-_asamuzakjp_css-color-7.1.7-LICENSE) |
| npm | @asamuzakjp/dom-selector 10.0.4 | MIT | build/test | [LICENSE](docs/licenses/npm-_asamuzakjp_dom-selector-10.0.4-LICENSE) |
| npm | @babel/helper-string-parser 7.29.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_babel_helper-string-parser-7.29.7-LICENSE) |
| npm | @babel/helper-validator-identifier 7.29.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_babel_helper-validator-identifier-7.29.7-LICENSE) |
| npm | @babel/parser 7.29.9 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_babel_parser-7.29.9-LICENSE) |
| npm | @babel/types 7.29.8 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_babel_types-7.29.8-LICENSE) |
| npm | @braintree/sanitize-url 7.1.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_braintree_sanitize-url-7.1.2-LICENSE) |
| npm | @bramus/specificity 2.4.3 | MIT | build/test | [LICENSE](docs/licenses/npm-_bramus_specificity-2.4.3-LICENSE) |
| npm | @chevrotain/types 11.1.2 | Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE.txt](docs/licenses/npm-_chevrotain_types-11.1.2-LICENSE.txt) |
| npm | @codemirror/autocomplete 6.20.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_autocomplete-6.20.3-LICENSE) |
| npm | @codemirror/commands 6.11.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_commands-6.11.1-LICENSE) |
| npm | @codemirror/lang-angular 0.1.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-angular-0.1.4-LICENSE) |
| npm | @codemirror/lang-cpp 6.0.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-cpp-6.0.3-LICENSE) |
| npm | @codemirror/lang-css 6.3.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-css-6.3.1-LICENSE) |
| npm | @codemirror/lang-go 6.0.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-go-6.0.1-LICENSE) |
| npm | @codemirror/lang-html 6.4.12 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-html-6.4.12-LICENSE) |
| npm | @codemirror/lang-java 6.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-java-6.0.2-LICENSE) |
| npm | @codemirror/lang-javascript 6.2.5 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-javascript-6.2.5-LICENSE) |
| npm | @codemirror/lang-jinja 6.0.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-jinja-6.0.1-LICENSE) |
| npm | @codemirror/lang-json 6.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-json-6.0.2-LICENSE) |
| npm | @codemirror/lang-less 6.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-less-6.0.2-LICENSE) |
| npm | @codemirror/lang-liquid 6.3.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-liquid-6.3.3-LICENSE) |
| npm | @codemirror/lang-markdown 6.5.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-markdown-6.5.2-LICENSE) |
| npm | @codemirror/lang-php 6.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-php-6.0.2-LICENSE) |
| npm | @codemirror/lang-python 6.2.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-python-6.2.1-LICENSE) |
| npm | @codemirror/lang-rust 6.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-rust-6.0.2-LICENSE) |
| npm | @codemirror/lang-sass 6.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-sass-6.0.2-LICENSE) |
| npm | @codemirror/lang-sql 6.10.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-sql-6.10.0-LICENSE) |
| npm | @codemirror/lang-vue 0.1.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-vue-0.1.3-LICENSE) |
| npm | @codemirror/lang-wast 6.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-wast-6.0.2-LICENSE) |
| npm | @codemirror/lang-xml 6.1.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-xml-6.1.0-LICENSE) |
| npm | @codemirror/lang-yaml 6.1.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lang-yaml-6.1.3-LICENSE) |
| npm | @codemirror/language 6.13.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_language-6.13.1-LICENSE) |
| npm | @codemirror/language-data 6.5.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_language-data-6.5.2-LICENSE) |
| npm | @codemirror/legacy-modes 6.5.5 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_legacy-modes-6.5.5-LICENSE) |
| npm | @codemirror/lint 6.9.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_lint-6.9.7-LICENSE) |
| npm | @codemirror/search 6.7.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_search-6.7.2-LICENSE) |
| npm | @codemirror/state 6.7.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_state-6.7.6-LICENSE) |
| npm | @codemirror/streamparser 6.0.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_streamparser-6.0.0-LICENSE) |
| npm | @codemirror/theme-one-dark 6.1.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_theme-one-dark-6.1.3-LICENSE) |
| npm | @codemirror/view 6.43.14 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_codemirror_view-6.43.14-LICENSE) |
| npm | @csstools/color-helpers 6.1.2 | MIT-0 | build/test | [LICENSE.md](docs/licenses/npm-_csstools_color-helpers-6.1.2-LICENSE.md) |
| npm | @csstools/css-calc 3.4.3 | MIT | build/test | [LICENSE.md](docs/licenses/npm-_csstools_css-calc-3.4.3-LICENSE.md) |
| npm | @csstools/css-color-parser 4.2.6 | MIT | build/test | [LICENSE.md](docs/licenses/npm-_csstools_css-color-parser-4.2.6-LICENSE.md) |
| npm | @csstools/css-parser-algorithms 4.0.2 | MIT | build/test | [LICENSE.md](docs/licenses/npm-_csstools_css-parser-algorithms-4.0.2-LICENSE.md) |
| npm | @csstools/css-syntax-patches-for-csstree 1.1.15 | MIT-0 | build/test | [LICENSE.md](docs/licenses/npm-_csstools_css-syntax-patches-for-csstree-1.1.15-LICENSE.md) |
| npm | @csstools/css-tokenizer 4.0.2 | MIT | build/test | [LICENSE.md](docs/licenses/npm-_csstools_css-tokenizer-4.0.2-LICENSE.md) |
| npm | @electron-internal/extract-zip 1.0.5 | BSD-2-Clause | build/test | [README.md](docs/licenses/npm-_electron-internal_extract-zip-1.0.5-README.md) |
| npm | @electron/get 5.1.0 | MIT | build/test | [LICENSE](docs/licenses/npm-_electron_get-5.1.0-LICENSE) |
| npm | @exodus/bytes 1.16.0 | MIT | build/test | [LICENSE](docs/licenses/npm-_exodus_bytes-1.16.0-LICENSE) |
| npm | @floating-ui/core 1.8.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_floating-ui_core-1.8.0-LICENSE) |
| npm | @floating-ui/dom 1.8.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_floating-ui_dom-1.8.0-LICENSE) |
| npm | @floating-ui/utils 0.2.12 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_floating-ui_utils-0.2.12-LICENSE) |
| npm | @iconify/types 2.0.0 | MIT | runtime/platform or Rust test dependency | [license.txt](docs/licenses/npm-_iconify_types-2.0.0-license.txt) |
| npm | @iconify/utils 3.1.7 | MIT | runtime/platform or Rust test dependency | [license.txt](docs/licenses/npm-_iconify_utils-3.1.7-license.txt) |
| npm | @jridgewell/resolve-uri 3.1.2 | MIT | build/test | [LICENSE](docs/licenses/npm-_jridgewell_resolve-uri-3.1.2-LICENSE) |
| npm | @jridgewell/sourcemap-codec 1.6.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_jridgewell_sourcemap-codec-1.6.0-LICENSE) |
| npm | @jridgewell/trace-mapping 0.3.31 | MIT | build/test | [LICENSE](docs/licenses/npm-_jridgewell_trace-mapping-0.3.31-LICENSE) |
| npm | @lezer/common 1.5.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_common-1.5.3-LICENSE) |
| npm | @lezer/cpp 1.1.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_cpp-1.1.6-LICENSE) |
| npm | @lezer/css 1.3.9 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_css-1.3.9-LICENSE) |
| npm | @lezer/go 1.0.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_go-1.0.1-LICENSE) |
| npm | @lezer/highlight 1.2.5 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_highlight-1.2.5-LICENSE) |
| npm | @lezer/html 1.3.13 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_html-1.3.13-LICENSE) |
| npm | @lezer/java 1.1.5 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_java-1.1.5-LICENSE) |
| npm | @lezer/javascript 1.5.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_javascript-1.5.6-LICENSE) |
| npm | @lezer/json 1.0.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_json-1.0.3-LICENSE) |
| npm | @lezer/lr 1.4.11 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_lr-1.4.11-LICENSE) |
| npm | @lezer/markdown 1.8.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_markdown-1.8.0-LICENSE) |
| npm | @lezer/php 1.0.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_php-1.0.6-LICENSE) |
| npm | @lezer/python 1.1.19 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_python-1.1.19-LICENSE) |
| npm | @lezer/rust 1.0.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_rust-1.0.3-LICENSE) |
| npm | @lezer/sass 1.1.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_sass-1.1.0-LICENSE) |
| npm | @lezer/xml 1.0.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_xml-1.0.6-LICENSE) |
| npm | @lezer/yaml 1.0.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_lezer_yaml-1.0.4-LICENSE) |
| npm | @marijn/find-cluster-break 1.0.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_marijn_find-cluster-break-1.0.4-LICENSE) |
| npm | @mermaid-js/parser 1.2.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_mermaid-js_parser-1.2.1-LICENSE) |
| npm | @milkdown/components 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_components-7.22.3-LICENSE) |
| npm | @milkdown/core 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_core-7.22.3-LICENSE) |
| npm | @milkdown/crepe 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_crepe-7.22.3-LICENSE) |
| npm | @milkdown/ctx 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_ctx-7.22.3-LICENSE) |
| npm | @milkdown/exception 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_exception-7.22.3-LICENSE) |
| npm | @milkdown/kit 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_kit-7.22.3-LICENSE) |
| npm | @milkdown/plugin-block 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-block-7.22.3-LICENSE) |
| npm | @milkdown/plugin-clipboard 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-clipboard-7.22.3-LICENSE) |
| npm | @milkdown/plugin-cursor 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-cursor-7.22.3-LICENSE) |
| npm | @milkdown/plugin-diff 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-diff-7.22.3-LICENSE) |
| npm | @milkdown/plugin-history 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-history-7.22.3-LICENSE) |
| npm | @milkdown/plugin-indent 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-indent-7.22.3-LICENSE) |
| npm | @milkdown/plugin-listener 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-listener-7.22.3-LICENSE) |
| npm | @milkdown/plugin-slash 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-slash-7.22.3-LICENSE) |
| npm | @milkdown/plugin-streaming 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-streaming-7.22.3-LICENSE) |
| npm | @milkdown/plugin-tooltip 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-tooltip-7.22.3-LICENSE) |
| npm | @milkdown/plugin-trailing 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-trailing-7.22.3-LICENSE) |
| npm | @milkdown/plugin-upload 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_plugin-upload-7.22.3-LICENSE) |
| npm | @milkdown/preset-commonmark 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_preset-commonmark-7.22.3-LICENSE) |
| npm | @milkdown/preset-gfm 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_preset-gfm-7.22.3-LICENSE) |
| npm | @milkdown/prose 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_prose-7.22.3-LICENSE) |
| npm | @milkdown/transformer 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_transformer-7.22.3-LICENSE) |
| npm | @milkdown/utils 7.22.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_milkdown_utils-7.22.3-LICENSE) |
| npm | @ocavue/utils 1.9.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_ocavue_utils-1.9.0-LICENSE) |
| npm | @oxc-project/types 0.154.0 | MIT | build/test | [LICENSE](docs/licenses/npm-_oxc-project_types-0.154.0-LICENSE) |
| npm | @rolldown/binding-linux-x64-gnu 1.2.14 | MIT | build/test | [LICENSE](docs/licenses/npm-_rolldown_binding-linux-x64-gnu-1.2.14-LICENSE) |
| npm | @rolldown/pluginutils 1.0.1 | MIT | build/test | [LICENSE](docs/licenses/npm-_rolldown_pluginutils-1.0.1-LICENSE) |
| npm | @sindresorhus/is 4.6.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-_sindresorhus_is-4.6.0-license) |
| npm | @types/chai 5.2.3 | MIT | build/test | [LICENSE](docs/licenses/npm-_types_chai-5.2.3-LICENSE) |
| npm | @types/d3 7.4.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-7.4.3-LICENSE) |
| npm | @types/d3-array 3.2.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-array-3.2.2-LICENSE) |
| npm | @types/d3-axis 3.0.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-axis-3.0.6-LICENSE) |
| npm | @types/d3-brush 3.0.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-brush-3.0.6-LICENSE) |
| npm | @types/d3-chord 3.0.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-chord-3.0.6-LICENSE) |
| npm | @types/d3-color 3.1.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-color-3.1.3-LICENSE) |
| npm | @types/d3-contour 3.0.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-contour-3.0.6-LICENSE) |
| npm | @types/d3-delaunay 6.0.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-delaunay-6.0.4-LICENSE) |
| npm | @types/d3-dispatch 3.0.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-dispatch-3.0.7-LICENSE) |
| npm | @types/d3-drag 3.0.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-drag-3.0.7-LICENSE) |
| npm | @types/d3-dsv 3.0.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-dsv-3.0.7-LICENSE) |
| npm | @types/d3-ease 3.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-ease-3.0.2-LICENSE) |
| npm | @types/d3-fetch 3.0.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-fetch-3.0.7-LICENSE) |
| npm | @types/d3-force 3.0.10 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-force-3.0.10-LICENSE) |
| npm | @types/d3-format 3.0.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-format-3.0.4-LICENSE) |
| npm | @types/d3-geo 3.1.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-geo-3.1.1-LICENSE) |
| npm | @types/d3-hierarchy 3.1.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-hierarchy-3.1.7-LICENSE) |
| npm | @types/d3-interpolate 3.0.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-interpolate-3.0.4-LICENSE) |
| npm | @types/d3-path 3.1.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-path-3.1.1-LICENSE) |
| npm | @types/d3-polygon 3.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-polygon-3.0.2-LICENSE) |
| npm | @types/d3-quadtree 3.0.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-quadtree-3.0.6-LICENSE) |
| npm | @types/d3-random 3.0.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-random-3.0.4-LICENSE) |
| npm | @types/d3-scale 4.0.9 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-scale-4.0.9-LICENSE) |
| npm | @types/d3-scale-chromatic 3.1.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-scale-chromatic-3.1.0-LICENSE) |
| npm | @types/d3-selection 3.0.12 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-selection-3.0.12-LICENSE) |
| npm | @types/d3-shape 3.2.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-shape-3.2.0-LICENSE) |
| npm | @types/d3-time 3.0.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-time-3.0.4-LICENSE) |
| npm | @types/d3-time-format 4.0.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-time-format-4.0.3-LICENSE) |
| npm | @types/d3-timer 3.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-timer-3.0.2-LICENSE) |
| npm | @types/d3-transition 3.0.9 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-transition-3.0.9-LICENSE) |
| npm | @types/d3-zoom 3.0.9 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_d3-zoom-3.0.9-LICENSE) |
| npm | @types/debug 4.1.13 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_debug-4.1.13-LICENSE) |
| npm | @types/deep-eql 4.0.2 | MIT | build/test | [LICENSE](docs/licenses/npm-_types_deep-eql-4.0.2-LICENSE) |
| npm | @types/estree 1.0.9 | MIT | build/test | [LICENSE](docs/licenses/npm-_types_estree-1.0.9-LICENSE) |
| npm | @types/geojson 7946.0.16 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_geojson-7946.0.16-LICENSE) |
| npm | @types/hast 3.0.5 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_hast-3.0.5-LICENSE) |
| npm | @types/jsdom 30.0.0 | MIT | build/test | [LICENSE](docs/licenses/npm-_types_jsdom-30.0.0-LICENSE) |
| npm | @types/katex 0.16.8 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_katex-0.16.8-LICENSE) |
| npm | @types/lodash 4.17.26 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_lodash-4.17.26-LICENSE) |
| npm | @types/lodash-es 4.17.12 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_lodash-es-4.17.12-LICENSE) |
| npm | @types/mdast 4.0.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_mdast-4.0.4-LICENSE) |
| npm | @types/ms 2.1.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_ms-2.1.0-LICENSE) |
| npm | @types/node 24.19.2 | MIT | build/test | [LICENSE](docs/licenses/npm-_types_node-24.19.2-LICENSE) |
| npm | @types/tough-cookie 4.0.5 | MIT | build/test | [LICENSE](docs/licenses/npm-_types_tough-cookie-4.0.5-LICENSE) |
| npm | @types/trusted-types 2.0.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_trusted-types-2.0.7-LICENSE) |
| npm | @types/unist 3.0.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_types_unist-3.0.3-LICENSE) |
| npm | @upsetjs/venn.js 2.0.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_upsetjs_venn.js-2.0.0-LICENSE) |
| npm | @vitest/mocker 5.0.5 | MIT | build/test | [LICENSE](docs/licenses/npm-_vitest_mocker-5.0.5-LICENSE) |
| npm | @vitest/spy 5.0.5 | MIT | build/test | [LICENSE](docs/licenses/npm-_vitest_spy-5.0.5-LICENSE) |
| npm | @vue/compiler-core 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_vue_compiler-core-3.5.44-LICENSE) |
| npm | @vue/compiler-dom 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_vue_compiler-dom-3.5.44-LICENSE) |
| npm | @vue/compiler-sfc 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_vue_compiler-sfc-3.5.44-LICENSE) |
| npm | @vue/compiler-ssr 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_vue_compiler-ssr-3.5.44-LICENSE) |
| npm | @vue/reactivity 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_vue_reactivity-3.5.44-LICENSE) |
| npm | @vue/runtime-core 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_vue_runtime-core-3.5.44-LICENSE) |
| npm | @vue/runtime-dom 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_vue_runtime-dom-3.5.44-LICENSE) |
| npm | @vue/server-renderer 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_vue_server-renderer-3.5.44-LICENSE) |
| npm | @vue/shared 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-_vue_shared-3.5.44-LICENSE) |
| npm | assertion-error 2.0.1 | MIT | build/test | [LICENSE](docs/licenses/npm-assertion-error-2.0.1-LICENSE) |
| npm | bail 2.0.2 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-bail-2.0.2-license) |
| npm | bidi-js 1.1.0 | MIT | build/test | [LICENSE.txt](docs/licenses/npm-bidi-js-1.1.0-LICENSE.txt) |
| npm | ccount 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-ccount-2.0.1-license) |
| npm | chai 6.3.0 | MIT | build/test | [LICENSE](docs/licenses/npm-chai-6.3.0-LICENSE) |
| npm | char-regex 1.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-char-regex-1.0.2-LICENSE) |
| npm | character-entities 2.0.2 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-character-entities-2.0.2-license) |
| npm | clsx 2.1.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-clsx-2.1.1-license) |
| npm | codemirror 6.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-codemirror-6.0.2-LICENSE) |
| npm | commander 15.0.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-commander-15.0.0-LICENSE) |
| npm | commander 7.2.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-commander-7.2.0-LICENSE) |
| npm | cose-base 1.0.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-cose-base-1.0.3-LICENSE) |
| npm | cose-base 2.2.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-cose-base-2.2.0-LICENSE) |
| npm | crelt 1.0.7 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-crelt-1.0.7-LICENSE) |
| npm | css-tree 3.2.1 | MIT | build/test | [LICENSE](docs/licenses/npm-css-tree-3.2.1-LICENSE) |
| npm | csstype 3.2.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-csstype-3.2.3-LICENSE) |
| npm | cytoscape 3.34.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-cytoscape-3.34.4-LICENSE), [license-update.mjs](docs/licenses/npm-cytoscape-3.34.4-license-update.mjs) |
| npm | cytoscape-cose-bilkent 4.1.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-cytoscape-cose-bilkent-4.1.0-LICENSE) |
| npm | cytoscape-fcose 2.2.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-cytoscape-fcose-2.2.0-LICENSE) |
| npm | d3 7.9.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-7.9.0-LICENSE) |
| npm | d3-array 2.12.1 | BSD-3-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-array-2.12.1-LICENSE) |
| npm | d3-array 3.2.4 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-array-3.2.4-LICENSE) |
| npm | d3-axis 3.0.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-axis-3.0.0-LICENSE) |
| npm | d3-brush 3.0.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-brush-3.0.0-LICENSE) |
| npm | d3-chord 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-chord-3.0.1-LICENSE) |
| npm | d3-color 3.1.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-color-3.1.0-LICENSE) |
| npm | d3-contour 4.0.2 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-contour-4.0.2-LICENSE) |
| npm | d3-delaunay 6.0.4 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-delaunay-6.0.4-LICENSE) |
| npm | d3-dispatch 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-dispatch-3.0.1-LICENSE) |
| npm | d3-drag 3.0.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-drag-3.0.0-LICENSE) |
| npm | d3-dsv 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-dsv-3.0.1-LICENSE) |
| npm | d3-ease 3.0.1 | BSD-3-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-ease-3.0.1-LICENSE) |
| npm | d3-fetch 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-fetch-3.0.1-LICENSE) |
| npm | d3-force 3.0.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-force-3.0.0-LICENSE) |
| npm | d3-format 3.1.2 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-format-3.1.2-LICENSE) |
| npm | d3-geo 3.1.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-geo-3.1.1-LICENSE) |
| npm | d3-hierarchy 3.1.2 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-hierarchy-3.1.2-LICENSE) |
| npm | d3-interpolate 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-interpolate-3.0.1-LICENSE) |
| npm | d3-path 1.0.9 | BSD-3-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-path-1.0.9-LICENSE) |
| npm | d3-path 3.1.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-path-3.1.0-LICENSE) |
| npm | d3-polygon 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-polygon-3.0.1-LICENSE) |
| npm | d3-quadtree 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-quadtree-3.0.1-LICENSE) |
| npm | d3-random 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-random-3.0.1-LICENSE) |
| npm | d3-sankey 0.12.3 | BSD-3-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-sankey-0.12.3-LICENSE) |
| npm | d3-scale 4.0.2 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-scale-4.0.2-LICENSE) |
| npm | d3-scale-chromatic 3.1.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-scale-chromatic-3.1.0-LICENSE) |
| npm | d3-selection 3.0.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-selection-3.0.0-LICENSE) |
| npm | d3-shape 1.3.7 | BSD-3-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-shape-1.3.7-LICENSE) |
| npm | d3-shape 3.2.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-shape-3.2.0-LICENSE) |
| npm | d3-time 3.1.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-time-3.1.0-LICENSE) |
| npm | d3-time-format 4.1.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-time-format-4.1.0-LICENSE) |
| npm | d3-timer 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-timer-3.0.1-LICENSE) |
| npm | d3-transition 3.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-transition-3.0.1-LICENSE) |
| npm | d3-zoom 3.0.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-d3-zoom-3.0.0-LICENSE) |
| npm | dagre-d3-es 7.0.14 | MIT | runtime/platform or Rust test dependency | [LICENSE.md](docs/licenses/npm-dagre-d3-es-7.0.14-LICENSE.md) |
| npm | data-urls 8.0.0 | MIT | build/test | [LICENSE.txt](docs/licenses/npm-data-urls-8.0.0-LICENSE.txt) |
| npm | dayjs 1.11.23 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-dayjs-1.11.23-LICENSE) |
| npm | debug 4.4.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-debug-4.4.3-LICENSE) |
| npm | decimal.js 10.6.0 | MIT | build/test | [LICENCE.md](docs/licenses/npm-decimal.js-10.6.0-LICENCE.md) |
| npm | decode-named-character-reference 1.3.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-decode-named-character-reference-1.3.0-license) |
| npm | delaunator 5.1.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-delaunator-5.1.0-LICENSE) |
| npm | dequal 2.0.3 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-dequal-2.0.3-license) |
| npm | detect-libc 2.1.2 | Apache-2.0 | build/test | [LICENSE](docs/licenses/npm-detect-libc-2.1.2-LICENSE) |
| npm | devlop 1.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-devlop-1.1.0-license) |
| npm | dompurify 3.4.17 | (MPL-2.0 OR Apache-2.0) | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-dompurify-3.4.17-LICENSE), [LICENSE-MPL](docs/licenses/npm-dompurify-3.4.17-LICENSE-MPL) |
| npm | electron 44.9.0 | MIT | build/test | [LICENSE](docs/licenses/npm-electron-44.9.0-LICENSE) |
| npm | emojilib 2.4.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-emojilib-2.4.0-LICENSE) |
| npm | entities 7.0.1 | BSD-2-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-entities-7.0.1-LICENSE) |
| npm | entities 8.1.0 | BSD-2-Clause | build/test | [LICENSE](docs/licenses/npm-entities-8.1.0-LICENSE) |
| npm | env-paths 3.0.0 | MIT | build/test | [license](docs/licenses/npm-env-paths-3.0.0-license) |
| npm | es-module-lexer 2.3.2 | MIT | build/test | [LICENSE](docs/licenses/npm-es-module-lexer-2.3.2-LICENSE) |
| npm | es-toolkit 1.52.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-es-toolkit-1.52.0-LICENSE), [NOTICE](docs/licenses/npm-es-toolkit-1.52.0-NOTICE) |
| npm | escape-string-regexp 5.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-escape-string-regexp-5.0.0-license) |
| npm | estree-walker 2.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-estree-walker-2.0.2-LICENSE) |
| npm | estree-walker 3.0.3 | MIT | build/test | [LICENSE](docs/licenses/npm-estree-walker-3.0.3-LICENSE) |
| npm | expect-type 1.4.0 | Apache-2.0 | build/test | [LICENSE](docs/licenses/npm-expect-type-1.4.0-LICENSE) |
| npm | extend 3.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-extend-3.0.2-LICENSE) |
| npm | fastdom 1.0.12 | MIT | runtime/platform or Rust test dependency | [README.md](docs/licenses/npm-fastdom-1.0.12-README.md) |
| npm | fdir 6.5.0 | MIT | build/test | [LICENSE](docs/licenses/npm-fdir-6.5.0-LICENSE) |
| npm | graceful-fs 4.2.11 | ISC | build/test | [LICENSE](docs/licenses/npm-graceful-fs-4.2.11-LICENSE) |
| npm | hachure-fill 0.5.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-hachure-fill-0.5.2-LICENSE) |
| npm | highlight.js 11.12.0 | BSD-3-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-highlight.js-11.12.0-LICENSE) |
| npm | html-encoding-sniffer 7.0.0 | MIT | build/test | [LICENSE.txt](docs/licenses/npm-html-encoding-sniffer-7.0.0-LICENSE.txt) |
| npm | html-to-image 1.11.13 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-html-to-image-1.11.13-LICENSE) |
| npm | iconv-lite 0.6.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-iconv-lite-0.6.3-LICENSE) |
| npm | import-meta-resolve 4.2.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-import-meta-resolve-4.2.0-license) |
| npm | internmap 1.0.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-internmap-1.0.1-LICENSE) |
| npm | internmap 2.0.3 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-internmap-2.0.3-LICENSE) |
| npm | is-plain-obj 4.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-is-plain-obj-4.1.0-license) |
| npm | is-potential-custom-element-name 1.0.1 | MIT | build/test | [LICENSE-MIT.txt](docs/licenses/npm-is-potential-custom-element-name-1.0.1-LICENSE-MIT.txt) |
| npm | jsdom 30.1.3 | MIT | build/test | [LICENSE.txt](docs/licenses/npm-jsdom-30.1.3-LICENSE.txt) |
| npm | katex 0.19.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-katex-0.19.0-LICENSE) |
| npm | khroma 2.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-khroma-2.1.0-license) |
| npm | layout-base 1.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-layout-base-1.0.2-LICENSE) |
| npm | layout-base 2.0.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-layout-base-2.0.1-LICENSE) |
| npm | lightningcss 1.33.0 | MPL-2.0 | build/test | [LICENSE](docs/licenses/npm-lightningcss-1.33.0-LICENSE) |
| npm | lightningcss-linux-x64-gnu 1.33.0 | MPL-2.0 | build/test | [LICENSE](docs/licenses/npm-lightningcss-linux-x64-gnu-1.33.0-LICENSE) |
| npm | lodash-es 4.18.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-lodash-es-4.18.1-LICENSE) |
| npm | longest-streak 3.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-longest-streak-3.1.0-license) |
| npm | lru-cache 11.5.3 | BlueOak-1.0.0 | build/test | [LICENSE.md](docs/licenses/npm-lru-cache-11.5.3-LICENSE.md) |
| npm | lucide 1.59.0 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-lucide-1.59.0-LICENSE) |
| npm | magic-string 0.30.21 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-magic-string-0.30.21-LICENSE) |
| npm | magic-string 1.4.3 | MIT | build/test | [LICENSE](docs/licenses/npm-magic-string-1.4.3-LICENSE) |
| npm | markdown-table 3.0.4 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-markdown-table-3.0.4-license) |
| npm | marked 16.4.2 | MIT | runtime/platform or Rust test dependency | [LICENSE.md](docs/licenses/npm-marked-16.4.2-LICENSE.md) |
| npm | marked 17.0.6 | MIT | runtime/platform or Rust test dependency | [LICENSE.md](docs/licenses/npm-marked-17.0.6-LICENSE.md) |
| npm | marked-alert 2.1.2 | MIT | runtime/platform or Rust test dependency | [marked-alert-2.1.2-LICENSE](docs/licenses/npm-marked-alert-2.1.2-marked-alert-2.1.2-LICENSE) |
| npm | marked-footnote 1.4.0 | MIT | runtime/platform or Rust test dependency | [marked-footnote-1.4.0-LICENSE](docs/licenses/npm-marked-footnote-1.4.0-marked-footnote-1.4.0-LICENSE) |
| npm | mdast-util-definitions 6.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-definitions-6.0.0-license) |
| npm | mdast-util-find-and-replace 3.0.3 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-find-and-replace-3.0.3-license) |
| npm | mdast-util-from-markdown 2.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-from-markdown-2.1.0-license) |
| npm | mdast-util-gfm 3.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-gfm-3.1.0-license) |
| npm | mdast-util-gfm-autolink-literal 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-gfm-autolink-literal-2.0.1-license) |
| npm | mdast-util-gfm-footnote 2.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-gfm-footnote-2.1.0-license) |
| npm | mdast-util-gfm-strikethrough 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-gfm-strikethrough-2.0.1-license) |
| npm | mdast-util-gfm-table 2.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-gfm-table-2.0.0-license) |
| npm | mdast-util-gfm-task-list-item 2.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-gfm-task-list-item-2.0.0-license) |
| npm | mdast-util-math 3.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-math-3.0.0-license) |
| npm | mdast-util-phrasing 4.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-phrasing-4.1.0-license) |
| npm | mdast-util-to-markdown 2.2.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-to-markdown-2.2.0-license) |
| npm | mdast-util-to-string 4.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-mdast-util-to-string-4.0.0-license) |
| npm | mdn-data 2.27.1 | CC0-1.0 | build/test | [LICENSE](docs/licenses/npm-mdn-data-2.27.1-LICENSE) |
| npm | mermaid 11.17.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-mermaid-11.17.2-LICENSE) |
| npm | micromark 4.0.3 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-4.0.3-license) |
| npm | micromark-core-commonmark 2.0.4 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-core-commonmark-2.0.4-license) |
| npm | micromark-extension-gfm 3.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-extension-gfm-3.0.0-license) |
| npm | micromark-extension-gfm-autolink-literal 2.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-extension-gfm-autolink-literal-2.1.0-license) |
| npm | micromark-extension-gfm-footnote 2.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-extension-gfm-footnote-2.1.0-license) |
| npm | micromark-extension-gfm-strikethrough 2.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-extension-gfm-strikethrough-2.1.0-license) |
| npm | micromark-extension-gfm-table 2.1.2 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-extension-gfm-table-2.1.2-license) |
| npm | micromark-extension-gfm-tagfilter 2.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-extension-gfm-tagfilter-2.0.0-license) |
| npm | micromark-extension-gfm-task-list-item 2.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-extension-gfm-task-list-item-2.1.0-license) |
| npm | micromark-extension-math 3.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-extension-math-3.1.0-license) |
| npm | micromark-factory-destination 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-factory-destination-2.0.1-license) |
| npm | micromark-factory-label 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-factory-label-2.0.1-license) |
| npm | micromark-factory-space 2.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-factory-space-2.1.0-license) |
| npm | micromark-factory-title 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-factory-title-2.0.1-license) |
| npm | micromark-factory-whitespace 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-factory-whitespace-2.0.1-license) |
| npm | micromark-util-character 2.1.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-character-2.1.1-license) |
| npm | micromark-util-chunked 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-chunked-2.0.1-license) |
| npm | micromark-util-classify-character 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-classify-character-2.0.1-license) |
| npm | micromark-util-combine-extensions 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-combine-extensions-2.0.1-license) |
| npm | micromark-util-decode-numeric-character-reference 2.0.2 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-decode-numeric-character-reference-2.0.2-license) |
| npm | micromark-util-decode-string 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-decode-string-2.0.1-license) |
| npm | micromark-util-edit-map 1.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-edit-map-1.0.0-license) |
| npm | micromark-util-encode 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-encode-2.0.1-license) |
| npm | micromark-util-html-tag-name 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-html-tag-name-2.0.1-license) |
| npm | micromark-util-normalize-identifier 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-normalize-identifier-2.0.1-license) |
| npm | micromark-util-resolve-all 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-resolve-all-2.0.1-license) |
| npm | micromark-util-sanitize-uri 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-sanitize-uri-2.0.1-license) |
| npm | micromark-util-subtokenize 2.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-subtokenize-2.1.0-license) |
| npm | micromark-util-symbol 2.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-symbol-2.0.1-license) |
| npm | micromark-util-types 2.0.3 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-micromark-util-types-2.0.3-license) |
| npm | ms 2.1.3 | MIT | runtime/platform or Rust test dependency | [license.md](docs/licenses/npm-ms-2.1.3-license.md) |
| npm | nanoid 3.3.20 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-nanoid-3.3.20-LICENSE) |
| npm | nanoid 6.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-nanoid-6.0.2-LICENSE) |
| npm | node-emoji 2.2.0 | MIT | runtime/platform or Rust test dependency | [LICENSE.md](docs/licenses/npm-node-emoji-2.2.0-LICENSE.md) |
| npm | obug 3.0.0 | MIT | build/test | [LICENSE](docs/licenses/npm-obug-3.0.0-LICENSE) |
| npm | orderedmap 2.1.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-orderedmap-2.1.1-LICENSE) |
| npm | package-manager-detector 1.9.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-package-manager-detector-1.9.0-LICENSE) |
| npm | parse5 8.0.1 | MIT | build/test | [LICENSE](docs/licenses/npm-parse5-8.0.1-LICENSE) |
| npm | path-data-parser 0.1.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-path-data-parser-0.1.0-LICENSE) |
| npm | picocolors 1.1.1 | ISC | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-picocolors-1.1.1-LICENSE) |
| npm | picomatch 4.0.7 | MIT | build/test | [LICENSE](docs/licenses/npm-picomatch-4.0.7-LICENSE) |
| npm | points-on-curve 0.2.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-points-on-curve-0.2.0-LICENSE) |
| npm | points-on-path 0.2.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-points-on-path-0.2.1-LICENSE) |
| npm | postcss 8.5.30 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-postcss-8.5.30-LICENSE) |
| npm | prettier 3.9.10 | MIT | build/test | [LICENSE](docs/licenses/npm-prettier-3.9.10-LICENSE) |
| npm | progress 2.0.3 | MIT | build/test | [LICENSE](docs/licenses/npm-progress-2.0.3-LICENSE) |
| npm | prosemirror-changeset 2.4.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-changeset-2.4.4-LICENSE) |
| npm | prosemirror-commands 1.7.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-commands-1.7.2-LICENSE) |
| npm | prosemirror-drop-indicator 0.1.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-drop-indicator-0.1.4-LICENSE) |
| npm | prosemirror-dropcursor 1.8.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-dropcursor-1.8.4-LICENSE) |
| npm | prosemirror-gapcursor 1.4.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-gapcursor-1.4.1-LICENSE) |
| npm | prosemirror-history 1.5.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-history-1.5.1-LICENSE) |
| npm | prosemirror-inputrules 1.5.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-inputrules-1.5.1-LICENSE) |
| npm | prosemirror-keymap 1.2.3 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-keymap-1.2.3-LICENSE) |
| npm | prosemirror-model 1.25.12 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-model-1.25.12-LICENSE) |
| npm | prosemirror-safari-ime-span 1.0.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-safari-ime-span-1.0.2-LICENSE) |
| npm | prosemirror-schema-list 1.5.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-schema-list-1.5.1-LICENSE) |
| npm | prosemirror-state 1.4.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-state-1.4.4-LICENSE) |
| npm | prosemirror-tables 1.8.5 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-tables-1.8.5-LICENSE) |
| npm | prosemirror-transform 1.12.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-transform-1.12.2-LICENSE) |
| npm | prosemirror-view 1.42.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-view-1.42.6-LICENSE) |
| npm | prosemirror-virtual-cursor 0.4.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-prosemirror-virtual-cursor-0.4.2-LICENSE) |
| npm | punycode 2.3.1 | MIT | build/test | [LICENSE-MIT.txt](docs/licenses/npm-punycode-2.3.1-LICENSE-MIT.txt) |
| npm | remark 15.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-remark-15.0.1-license) |
| npm | remark-gfm 4.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-remark-gfm-4.0.1-license) |
| npm | remark-inline-links 7.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-remark-inline-links-7.0.0-license) |
| npm | remark-math 6.0.0 | MIT | runtime/platform or Rust test dependency | [remark-math-6.0.0-LICENSE](docs/licenses/npm-remark-math-6.0.0-remark-math-6.0.0-LICENSE) |
| npm | remark-parse 11.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-remark-parse-11.0.0-license) |
| npm | remark-stringify 11.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-remark-stringify-11.0.0-license) |
| npm | require-from-string 2.0.2 | MIT | build/test | [license](docs/licenses/npm-require-from-string-2.0.2-license) |
| npm | robust-predicates 3.0.3 | Unlicense | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-robust-predicates-3.0.3-LICENSE) |
| npm | rolldown 1.2.14 | MIT | build/test | [LICENSE](docs/licenses/npm-rolldown-1.2.14-LICENSE) |
| npm | rope-sequence 1.3.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-rope-sequence-1.3.4-LICENSE) |
| npm | roughjs 4.6.6 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-roughjs-4.6.6-LICENSE) |
| npm | rw 1.3.3 | BSD-3-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-rw-1.3.3-LICENSE) |
| npm | safer-buffer 2.1.2 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-safer-buffer-2.1.2-LICENSE) |
| npm | saxes 6.0.0 | ISC | build/test | [saxes-6.0.0-LICENSE](docs/licenses/npm-saxes-6.0.0-saxes-6.0.0-LICENSE) |
| npm | semver 7.8.5 | ISC | build/test | [LICENSE](docs/licenses/npm-semver-7.8.5-LICENSE) |
| npm | skin-tone 2.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-skin-tone-2.0.0-license) |
| npm | source-map-js 1.2.2 | BSD-3-Clause | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-source-map-js-1.2.2-LICENSE) |
| npm | std-env 4.3.0 | MIT | build/test | [LICENCE](docs/licenses/npm-std-env-4.3.0-LICENCE) |
| npm | strictdom 1.0.1 | MIT | runtime/platform or Rust test dependency | [README.md](docs/licenses/npm-strictdom-1.0.1-README.md) |
| npm | style-mod 4.1.4 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-style-mod-4.1.4-LICENSE) |
| npm | stylis 4.4.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-stylis-4.4.0-LICENSE) |
| npm | sumchecker 3.0.1 | Apache-2.0 | build/test | [LICENSE](docs/licenses/npm-sumchecker-3.0.1-LICENSE) |
| npm | tinybench 6.2.2 | MIT | build/test | [LICENSE](docs/licenses/npm-tinybench-6.2.2-LICENSE) |
| npm | tinyexec 1.3.1 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-tinyexec-1.3.1-LICENSE) |
| npm | tinyglobby 0.2.17 | MIT | build/test | [LICENSE](docs/licenses/npm-tinyglobby-0.2.17-LICENSE) |
| npm | tldts 7.4.18 | MIT | build/test | [LICENSE](docs/licenses/npm-tldts-7.4.18-LICENSE) |
| npm | tldts-core 7.4.18 | MIT | build/test | [LICENSE](docs/licenses/npm-tldts-core-7.4.18-LICENSE) |
| npm | tough-cookie 6.0.2 | BSD-3-Clause | build/test | [LICENSE](docs/licenses/npm-tough-cookie-6.0.2-LICENSE) |
| npm | tr46 7.0.0 | MIT | build/test | [LICENSE.md](docs/licenses/npm-tr46-7.0.0-LICENSE.md) |
| npm | trough 2.2.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-trough-2.2.0-license) |
| npm | ts-dedent 2.3.0 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-ts-dedent-2.3.0-LICENSE) |
| npm | typescript 5.9.3 | Apache-2.0 | runtime/platform or Rust test dependency | [LICENSE.txt](docs/licenses/npm-typescript-5.9.3-LICENSE.txt) |
| npm | undici 7.30.1 | MIT | build/test | [LICENSE](docs/licenses/npm-undici-7.30.1-LICENSE) |
| npm | undici 8.12.2 | MIT | build/test | [LICENSE](docs/licenses/npm-undici-8.12.2-LICENSE) |
| npm | undici-types 7.24.6 | MIT | build/test | [LICENSE](docs/licenses/npm-undici-types-7.24.6-LICENSE) |
| npm | undici-types 8.12.2 | MIT | build/test | [LICENSE](docs/licenses/npm-undici-types-8.12.2-LICENSE) |
| npm | unicode-emoji-modifier-base 1.0.0 | MIT | runtime/platform or Rust test dependency | [LICENSE-MIT.txt](docs/licenses/npm-unicode-emoji-modifier-base-1.0.0-LICENSE-MIT.txt) |
| npm | unified 11.0.5 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-unified-11.0.5-license) |
| npm | unist-util-is 6.0.1 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-unist-util-is-6.0.1-license) |
| npm | unist-util-remove-position 5.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-unist-util-remove-position-5.0.0-license) |
| npm | unist-util-stringify-position 4.0.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-unist-util-stringify-position-4.0.0-license) |
| npm | unist-util-visit 5.1.0 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-unist-util-visit-5.1.0-license) |
| npm | unist-util-visit-parents 6.0.2 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-unist-util-visit-parents-6.0.2-license) |
| npm | uuid 11.1.1 | MIT | runtime/platform or Rust test dependency | [LICENSE.md](docs/licenses/npm-uuid-11.1.1-LICENSE.md) |
| npm | vfile 6.0.3 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-vfile-6.0.3-license) |
| npm | vfile-message 4.0.3 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-vfile-message-4.0.3-license) |
| npm | vite 8.3.4 | MIT | build/test | [LICENSE.md](docs/licenses/npm-vite-8.3.4-LICENSE.md) |
| npm | vitest 5.0.5 | MIT | build/test | [LICENSE.md](docs/licenses/npm-vitest-5.0.5-LICENSE.md) |
| npm | vue 3.5.44 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-vue-3.5.44-LICENSE) |
| npm | w3c-keyname 2.2.8 | MIT | runtime/platform or Rust test dependency | [LICENSE](docs/licenses/npm-w3c-keyname-2.2.8-LICENSE) |
| npm | w3c-xmlserializer 6.0.0 | MIT | build/test | [LICENSE.md](docs/licenses/npm-w3c-xmlserializer-6.0.0-LICENSE.md) |
| npm | webidl-conversions 8.0.1 | BSD-2-Clause | build/test | [LICENSE.md](docs/licenses/npm-webidl-conversions-8.0.1-LICENSE.md) |
| npm | whatwg-mimetype 5.0.0 | MIT | build/test | [LICENSE.txt](docs/licenses/npm-whatwg-mimetype-5.0.0-LICENSE.txt) |
| npm | whatwg-url 17.3.0 | MIT | build/test | [LICENSE.txt](docs/licenses/npm-whatwg-url-17.3.0-LICENSE.txt) |
| npm | why-is-node-running 3.2.1 | MIT | build/test | [LICENSE](docs/licenses/npm-why-is-node-running-3.2.1-LICENSE) |
| npm | xml-name-validator 5.0.0 | Apache-2.0 | build/test | [LICENSE.txt](docs/licenses/npm-xml-name-validator-5.0.0-LICENSE.txt) |
| npm | xmlchars 2.2.0 | MIT | build/test | [LICENSE](docs/licenses/npm-xmlchars-2.2.0-LICENSE) |
| npm | zwitch 2.0.4 | MIT | runtime/platform or Rust test dependency | [license](docs/licenses/npm-zwitch-2.0.4-license) |

## Regeneration

`python3 scripts/notices.py` after `npm ci --prefix web` and `cargo fetch`.

The original project code is licensed separately in LICENSE. These notices do not relicense dependencies or constitute legal clearance.
