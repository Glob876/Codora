# Licensing / Лицензирование

## Current license / Текущая лицензия

Original Codora material is offered under GNU Affero General Public License
version 3 or (at your option) any later version: `AGPL-3.0-or-later`.
The full terms are in [LICENSE](../LICENSE); attribution is in [COPYRIGHT](../COPYRIGHT).
No additional custom restrictions are added.

Оригинальные материалы Codora распространяются под GNU AGPL версии 3
или, на ваш выбор, более поздней. Дополнительных собственных ограничений нет.

Commercial use, modification and redistribution are allowed. Preserve copyright
and license notices, mark changes with their date, and provide the corresponding
source under the license when distributing covered modified versions. Modified
network versions must prominently offer their corresponding source to users
interacting with them remotely (section 13). Private modifications without
conveying copies or remote user interaction need not be published.

Разрешены коммерческое использование, изменения и распространение. Сохраняйте
авторство и лицензионные уведомления, отмечайте изменения и их дату. При
распространении изменённой версии предоставляйте соответствующие исходники на
условиях лицензии; пользователям изменённой сетевой версии также нужно явно
предлагать её исходники. Личные изменения без передачи копий и удалённого
взаимодействия с пользователями публиковать не требуется.

These obligations cover the program and covered derivatives, not documents
written with the editor or separate independent programs distributed alongside it.
Обязательства относятся к программе и её производным, а не к вашим заметкам
или самостоятельным программам, распространяемым рядом с редактором.

## Earlier revisions / Предыдущие редакции

The AGPL transition follows commit
`a1169eb` (`docs: provide English and Russian READMEs with language navigation`).
That commit and earlier published revisions were offered under MIT. Copies
obtained under MIT retain those permissions; this transition does not revoke
them. The original notice is preserved in [legacy-MIT.txt](legacy-MIT.txt)
and in Git history. This file records the historical grant, not an alternative
license for subsequent new contributions.

Коммит `a1169eb` и опубликованные до него редакции были доступны под MIT.
Полученные на этих условиях копии сохраняют прежние разрешения. Новая лицензия
не отменяет их задним числом. Исходное уведомление сохранено в
[legacy-MIT.txt](legacy-MIT.txt) и истории Git; это исторические условия,
а не альтернативная лицензия для последующих новых изменений.

## Dependencies and distribution / Зависимости и распространение

Third-party materials retain their own licenses. Preserve
[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) and [license texts](licenses/).
The project license does not replace dependency licenses.

README logo lettering uses Manrope SemiBold, exported from Figma as outlined
SVG paths. The [SIL Open Font License 1.1 notice](licenses/Manrope-OFL.txt) is
retained; no Manrope font binary is bundled. The folded-ribbon mark is original
Codora artwork, with provenance recorded in [clean-room.md](clean-room.md).

`./scripts/package.sh` packages a committed source snapshot, build instructions,
lockfiles, npm dependencies and vendored Rust crates alongside the executable.
The source archive contains `SOURCE-BUILD.md` with rebuild instructions. Publish
that archive alongside each binary package. Forks must update the source link
in the About dialog to their own corresponding source and preserve notices.

Зависимости сохраняют собственные лицензии и уведомления. Скрипт упаковки
добавляет архив исходников с зависимостями и инструкцией сборки. Публикуйте его
вместе с бинарным архивом. В изменённых версиях обновляйте ссылку на исходники
в окне «О программе», чтобы она вела на код именно вашей версии.

## References / Источники

- [AGPL v3 text, SPDX](https://spdx.org/licenses/AGPL-3.0-or-later.html), sections 4–6 and 13.
- [GNU licensing FAQ](https://www.gnu.org/licenses/gpl-faq.en.html).
- [MIT text, OSI](https://opensource.org/license/mit).

## Desktop runtime inventory and remaining distribution review

Electron 44.9.0 is MIT, but its complete Chromium/Node/FFmpeg runtime contains
additional licenses. The unmodified LICENSE and LICENSES.chromium.html are kept
in docs/licenses and copied alongside the runtime. The aggregate inventory entry
`MIT AND LicenseRef-Chromium-ThirdParty` deliberately does not label all bundled
code MIT. The automated license check verifies retained notices; it does not audit
every component in that upstream HTML or discharge source/relinking obligations.
Before public desktop distribution, review those obligations (including shared
FFmpeg libraries) against the exact Electron release sources:
https://github.com/electron/electron/releases/tag/v44.9.0 .
The existing Codora source archive alone is not the corresponding source for
Electron/Chromium or its dictionaries.

Exception: build-time `@electron-internal/extract-zip` 1.0.5 declares BSD-2-Clause
in both its npm manifest and README, but omits the complete license grant from
its npm package and release commit b83e459fd04c53b0a1c8438a6792df8f64be47fc.
The exact distributed README is retained as its notice. Obtain the full upstream
grant or replace this build dependency before public redistribution of the
vendored build-tool source archive. The extractor is not used by the shipped
application at runtime. This exception is recorded, not silently treated as a
complete license-text audit.

The two shipped .bdic dictionaries are unmodified build dependencies from the
pinned Electron dictionary archive. Its complete LICENSE/COPYING files are
retained under docs/dictionary-notices and included in both distributions. That
archive aggregates several dictionary licenses; per-language provenance and any
corresponding-source requirements remain part of the public distribution review.
No package is uploaded or published by building a local desktop archive.
