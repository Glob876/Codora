//! Application session persistence. Only a workspace path is stored, never tokens or text.
use crate::core::{Result, atomic_write, bad};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};

#[derive(Serialize, Deserialize)]
struct Session {
    root: PathBuf,
}

pub fn restore(path: &Path) -> Result<Option<PathBuf>> {
    let metadata = match fs::symlink_metadata(path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.into()),
    };
    if !metadata.is_file() || metadata.len() > 64 * 1024 {
        return Err(bad("Некорректный файл сессии Codora"));
    }
    Ok(Some(
        serde_json::from_slice::<Session>(&fs::read(path)?)?.root,
    ))
}
pub fn remember(path: &Path, root: &Path) -> Result<()> {
    if fs::symlink_metadata(path).is_ok_and(|m| !m.is_file()) {
        return Err(bad("Файл сессии не может быть ссылкой или папкой"));
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    atomic_write(path, &serde_json::to_vec(&Session { root: root.into() })?)
}
pub fn default_path() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    let base = std::env::var_os("APPDATA").map(PathBuf::from);
    #[cfg(not(target_os = "windows"))]
    let base = std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".config")));
    base.map(|base| base.join("Codora/session.json"))
}
