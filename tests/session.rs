use codora::{core::Workspace, session};
use std::fs;
#[test]
fn workspace_change_survives_restart_without_document_or_token_data() {
    let config = tempfile::tempdir().unwrap();
    let first = tempfile::tempdir().unwrap();
    let second = tempfile::tempdir().unwrap();
    let file = config.path().join("config/session.json");
    assert!(session::restore(&file).unwrap().is_none());
    let mut workspace = Workspace::open(first.path())
        .unwrap()
        .with_session(file.clone())
        .unwrap();
    workspace.change_root(second.path()).unwrap();
    assert_eq!(
        session::restore(&file).unwrap().unwrap(),
        second.path().canonicalize().unwrap()
    );
    let stored: serde_json::Value = serde_json::from_slice(&fs::read(&file).unwrap()).unwrap();
    assert_eq!(stored.as_object().unwrap().len(), 1);
    assert!(
        workspace
            .change_root(config.path().join("missing"))
            .is_err()
    );
    assert_eq!(
        session::restore(&file).unwrap().unwrap(),
        second.path().canonicalize().unwrap()
    );
}
#[test]
fn failed_session_write_does_not_switch_workspace() {
    let config = tempfile::tempdir().unwrap();
    let first = tempfile::tempdir().unwrap();
    let second = tempfile::tempdir().unwrap();
    let file = config.path().join("session.json");
    let mut workspace = Workspace::open(first.path())
        .unwrap()
        .with_session(file.clone())
        .unwrap();
    fs::remove_file(&file).unwrap();
    fs::create_dir(&file).unwrap();
    assert!(workspace.change_root(second.path()).is_err());
    assert_eq!(workspace.root, first.path().canonicalize().unwrap());
    assert!(session::restore(&file).is_err());
}
