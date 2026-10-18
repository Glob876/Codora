use std::fs;
use tempfile::tempdir;
use typoha::core::{Draft, Save, Search, Workspace};
fn save(
    w: &Workspace,
    path: &str,
    content: &str,
    rev: Option<String>,
) -> typoha::core::Result<typoha::core::Document> {
    w.save(Save {
        path: path.into(),
        content: content.into(),
        expected_revision: rev,
    })
}
#[test]
fn save_conflict_retains_disk_and_history() {
    let tmp = tempdir().unwrap();
    let w = Workspace::open(tmp.path()).unwrap();
    let a = save(&w, "заметка.md", "Привет 🌱", None).unwrap();
    assert_eq!(w.read("заметка.md").unwrap().content, "Привет 🌱");
    let b = save(&w, "заметка.md", "Изменено", Some(a.revision)).unwrap();
    let h = w.history("заметка.md").unwrap();
    assert_eq!(h.len(), 1);
    assert_eq!(w.snapshot("заметка.md", &h[0].id).unwrap(), "Привет 🌱");
    fs::write(tmp.path().join("заметка.md"), "внешнее изменение").unwrap();
    let error = save(&w, "заметка.md", "перезапись", Some(b.revision)).unwrap_err();
    assert_eq!(error.0, 409);
    assert_eq!(w.read("заметка.md").unwrap().content, "внешнее изменение");
    assert!(save(&w, "заметка.md", "overwrite", None).is_err());
}
#[test]
fn deleted_file_is_not_recreated_by_stale_save() {
    let t = tempdir().unwrap();
    let w = Workspace::open(t.path()).unwrap();
    let d = save(&w, "a.md", "a", None).unwrap();
    fs::remove_file(t.path().join("a.md")).unwrap();
    assert_eq!(save(&w, "a.md", "b", Some(d.revision)).unwrap_err().0, 409);
    assert!(!t.path().join("a.md").exists());
}
#[test]
fn traversal_metadata_and_absolute_paths_are_rejected() {
    let t = tempdir().unwrap();
    let w = Workspace::open(t.path()).unwrap();
    for p in [
        "../x",
        "/tmp/x",
        "a/../../x",
        ".typoha/drafts/a",
        "",
        "a/.typoha/x",
    ] {
        assert!(w.resolve(p).is_err(), "{p}");
    }
    assert!(w.resolve("folder/file.md").is_ok());
    assert!(w.snapshot("a.md", "../x").is_err());
}
#[cfg(unix)]
#[test]
fn symlinks_and_dangling_symlinks_cannot_escape() {
    use std::os::unix::fs::symlink;
    let t = tempdir().unwrap();
    let outside = tempdir().unwrap();
    let w = Workspace::open(t.path()).unwrap();
    symlink(outside.path(), t.path().join("escape")).unwrap();
    assert!(w.resolve("escape/a.md").is_err());
    symlink(
        outside.path().join("nonexistent"),
        t.path().join("dangling"),
    )
    .unwrap();
    assert!(save(&w, "dangling", "bad", None).is_err());
    assert!(!outside.path().join("nonexistent").exists());
}
#[cfg(unix)]
#[test]
fn metadata_symlink_rejected() {
    use std::os::unix::fs::symlink;
    let t = tempdir().unwrap();
    let o = tempdir().unwrap();
    symlink(o.path(), t.path().join(".typoha")).unwrap();
    assert!(Workspace::open(t.path()).is_err());
    assert!(fs::read_dir(o.path()).unwrap().next().is_none());
}
#[test]
fn recoverable_trash_refuses_restore_over_existing() {
    let t = tempdir().unwrap();
    let w = Workspace::open(t.path()).unwrap();
    save(&w, "a.md", "original", None).unwrap();
    let id = w.trash("a.md").unwrap();
    assert!(!t.path().join("a.md").exists());
    assert_eq!(w.trash_list().unwrap().len(), 1);
    save(&w, "a.md", "other", None).unwrap();
    assert_eq!(w.restore(&id).unwrap_err().0, 409);
    w.trash("a.md").unwrap();
    w.restore(&id).unwrap();
    assert_eq!(w.read("a.md").unwrap().content, "original");
}
#[test]
fn folder_move_and_listing_hide_internal_files() {
    let t = tempdir().unwrap();
    let w = Workspace::open(t.path()).unwrap();
    w.mkdir("folder").unwrap();
    save(&w, "folder/a.md", "note", None).unwrap();
    fs::write(t.path().join("binary.bin"), [0, 255, 12]).unwrap();
    w.rename("folder", "renamed").unwrap();
    assert_eq!(w.read("renamed/a.md").unwrap().content, "note");
    let list = w.list(false, false).unwrap();
    assert_eq!(list.len(), 2);
    assert!(list.iter().all(|e| !e.path.contains(".typoha")));
    assert_eq!(w.list(false, true).unwrap().len(), 3);
}
#[test]
fn regex_search_is_unicode_aware_and_reports_invalid_expression() {
    let t = tempdir().unwrap();
    let w = Workspace::open(t.path()).unwrap();
    save(&w, "a.md", "Русский текст\nТекст\nтекстовый", None).unwrap();
    let q = Search {
        query: "текст".into(),
        regex: false,
        case_sensitive: false,
        whole_word: true,
    };
    let hits = w.search(&q).unwrap();
    assert_eq!(hits.len(), 2);
    assert_eq!(hits[0].line, 1);
    assert_eq!(hits[1].line, 2);
    assert!(
        w.search(&Search {
            query: "[".into(),
            regex: true,
            case_sensitive: false,
            whole_word: false
        })
        .is_err()
    );
}
#[test]
fn drafts_preserve_unsupported_syntax_exactly() {
    let t = tempdir().unwrap();
    let w = Workspace::open(t.path()).unwrap();
    let source = "---\r\ntitle: test\r\n---\r\n\n<details>raw</details>\n[^n]: note\n";
    let d = Draft {
        id: "draft-1".into(),
        path: Some("a.md".into()),
        content: source.into(),
    };
    w.save_draft(&d).unwrap();
    assert_eq!(w.drafts().unwrap()[0].content, source);
    w.clear_draft("draft-1").unwrap();
    assert!(w.drafts().unwrap().is_empty());
    assert!(
        w.save_draft(&Draft {
            id: "../escape".into(),
            path: None,
            content: "x".into()
        })
        .is_err()
    );
}
