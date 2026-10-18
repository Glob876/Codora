//! Workspace options and application appearance, independent of HTTP/UI.
use crate::core::{self, Workspace};
use serde_json::{Value, json};

pub fn load(workspace: &Workspace) -> core::Result<Value> {
    let path = workspace.metadata_file("config", "preferences.json")?;
    let mut preferences = read_preferences(&path)?;
    if let Some(path) = workspace.appearance_path() {
        let appearance = read_preferences(&path)?;
        for key in APPEARANCE_KEYS {
            if let Some(value) = appearance.get(*key) {
                preferences[*key] = value.clone();
            }
        }
    }
    Ok(preferences)
}
// Keep document paths and workspace-specific CSS out of application settings.
const APPEARANCE_KEYS: &[&str] = &[
    "theme",
    "primaryColor",
    "secondaryColor",
    "textColor",
    "backgroundOpacity",
    "language",
    "animations",
    "toolbar",
    "statusbar",
    "sidebarWidth",
];
fn read_preferences(path: &std::path::Path) -> core::Result<Value> {
    let metadata = match std::fs::symlink_metadata(path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(json!({})),
        Err(error) => return Err(error.into()),
    };
    if !metadata.is_file() || metadata.len() > 256_000 {
        return Err(core::bad("Некорректный файл настроек"));
    }
    let value: Value = serde_json::from_slice(&std::fs::read(path)?)?;
    if !value.is_object() {
        return Err(core::bad("Некорректные настройки"));
    }
    Ok(value)
}
pub fn save(workspace: &Workspace, q: &Value) -> core::Result<()> {
    let bytes = serde_json::to_vec_pretty(q)?;
    if !q.is_object() || bytes.len() > 256_000 {
        return Err(core::bad("Некорректные настройки"));
    }
    core::atomic_write(
        &workspace.internal("config")?.join("preferences.json"),
        &bytes,
    )?;
    if let Some(path) = workspace.appearance_path() {
        if std::fs::symlink_metadata(&path).is_ok_and(|m| !m.is_file()) {
            return Err(core::bad("Файл настроек не может быть ссылкой или папкой"));
        }
        let appearance: serde_json::Map<String, Value> = APPEARANCE_KEYS
            .iter()
            .filter_map(|key| q.get(*key).map(|value| ((*key).to_string(), value.clone())))
            .collect();
        core::atomic_write(&path, &serde_json::to_vec_pretty(&appearance)?)?;
    }
    Ok(())
}
