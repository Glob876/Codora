//! Console-only, workspace-scoped TOML configuration; no HTTP or UI dependencies.
use super::{Command, Palette, Result, colors, error};
use crate::core::{self, Workspace};
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::style::Color;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub const EXAMPLE: &str = include_str!("../console.example.toml");

#[derive(Clone, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct Settings {
    pub theme: usize,
    pub numbers: bool,
    pub autosave: bool,
    pub indent: u8,
    pub hidden: bool,
    pub sidebar: bool,
    pub focus: bool,
    pub sidebar_width: u16,
    pub output_percent: u16,
    pub draft_delay_ms: u64,
    pub autosave_delay_ms: u64,
    pub poll_interval_ms: u64,
    pub preview_page_lines: u16,
    pub colors: BTreeMap<String, String>,
    pub bindings: BTreeMap<String, Command>,
}
impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: 0,
            numbers: true,
            autosave: false,
            indent: 4,
            hidden: false,
            sidebar: true,
            focus: false,
            sidebar_width: 26,
            output_percent: 32,
            draft_delay_ms: 600,
            autosave_delay_ms: 2000,
            poll_interval_ms: 80,
            preview_page_lines: 15,
            colors: BTreeMap::new(),
            bindings: BTreeMap::new(),
        }
    }
}
impl Settings {
    pub fn parse(source: &str) -> Result<Self> {
        let settings: Self =
            toml::from_str(source).map_err(|e| error(format!("console.toml: {e}")))?;
        settings.validate()?;
        Ok(settings)
    }
    fn validate(&self) -> Result<()> {
        if self.theme > 2
            || !(1..=16).contains(&self.indent)
            || !(12..=100).contains(&self.sidebar_width)
            || !(10..=70).contains(&self.output_percent)
            || !(100..=60_000).contains(&self.draft_delay_ms)
            || !(100..=600_000).contains(&self.autosave_delay_ms)
            || !(10..=1000).contains(&self.poll_interval_ms)
            || !(1..=1000).contains(&self.preview_page_lines)
        {
            return Err(error(
                "console.toml: setting outside allowed range; see docs/console-config.md",
            ));
        }
        self.palette()?;
        let mut keys = Vec::new();
        for binding in self.bindings.keys() {
            let key = parse_key(binding)?;
            if keys.contains(&key) {
                return Err(error(format!("console.toml: duplicate shortcut {binding}")));
            }
            keys.push(key);
        }
        Ok(())
    }
    pub fn palette(&self) -> Result<Palette> {
        let mut p = colors(self.theme);
        for (name, value) in &self.colors {
            let slot = match name.as_str() {
                "background" => &mut p.bg,
                "foreground" => &mut p.fg,
                "muted" => &mut p.muted,
                "accent" => &mut p.accent,
                "panel" => &mut p.panel,
                "error" => &mut p.error,
                "selection_background" => &mut p.selection_bg,
                "selection_foreground" => &mut p.selection_fg,
                "cursor" => &mut p.cursor,
                "heading" => &mut p.heading,
                "code" => &mut p.code,
                "logo_peach" => &mut p.logo_peach,
                "logo_raspberry" => &mut p.logo_raspberry,
                "logo_coral" => &mut p.logo_coral,
                _ => return Err(error(format!("console.toml: unknown color {name}"))),
            };
            *slot = value
                .parse::<Color>()
                .map_err(|_| error(format!("console.toml: invalid color {name} = {value}")))?;
        }
        Ok(p)
    }
    pub fn binding(&self, key: KeyEvent) -> Option<Command> {
        self.bindings.iter().find_map(|(name, command)| {
            parse_key(name)
                .ok()
                .filter(|(code, modifiers)| *code == key.code && *modifiers == key.modifiers)
                .map(|_| *command)
        })
    }
}
fn parse_key(value: &str) -> Result<(KeyCode, KeyModifiers)> {
    let normalized = value.to_ascii_lowercase();
    let parts: Vec<_> = normalized.split('+').collect();
    let mut modifiers = KeyModifiers::NONE;
    for part in &parts[..parts.len().saturating_sub(1)] {
        let modifier = match *part {
            "ctrl" => KeyModifiers::CONTROL,
            "alt" => KeyModifiers::ALT,
            "shift" => KeyModifiers::SHIFT,
            _ => return Err(error(format!("console.toml: invalid shortcut {value}"))),
        };
        if modifiers.contains(modifier) {
            return Err(error(format!(
                "console.toml: duplicate modifier in {value}"
            )));
        }
        modifiers |= modifier;
    }
    let name = parts.last().copied().unwrap_or("");
    let code = if let Some(n) = name
        .strip_prefix('f')
        .and_then(|n| n.parse::<u8>().ok())
        .filter(|n| (1..=12).contains(n))
    {
        KeyCode::F(n)
    } else if name.chars().count() == 1
        && modifiers.intersects(KeyModifiers::CONTROL | KeyModifiers::ALT)
    {
        let ch = name.chars().next().unwrap();
        KeyCode::Char(if modifiers.contains(KeyModifiers::SHIFT) {
            ch.to_ascii_uppercase()
        } else {
            ch
        })
    } else {
        return Err(error(format!(
            "console.toml: use Ctrl/Alt+letter or F1..F12: {value}"
        )));
    };
    Ok((code, modifiers))
}

pub fn load(workspace: &Workspace) -> Result<(Settings, String)> {
    let path = workspace.metadata_file("config", "console.toml")?;
    if !path.exists() {
        // Only migrate the console namespace; desktop preferences stay untouched.
        let prefs = crate::preferences::load(workspace)?;
        let settings: Settings = prefs
            .get("console")
            .cloned()
            .map(serde_json::from_value)
            .transpose()?
            .unwrap_or_default();
        settings.validate()?;
        let source = if prefs.get("console").is_some() {
            toml::to_string_pretty(&settings).map_err(|e| error(e.to_string()))?
        } else {
            EXAMPLE.into()
        };
        core::atomic_write(&path, source.as_bytes())?;
    }
    let metadata = std::fs::symlink_metadata(&path)?;
    if !metadata.is_file() || metadata.len() > 256_000 {
        return Err(error(
            "console.toml must be a regular file smaller than 256 KB",
        ));
    }
    let source = std::fs::read_to_string(&path)?;
    Ok((Settings::parse(&source)?, source))
}

pub fn save(workspace: &Workspace, settings: &Settings, previous: &mut String) -> Result<()> {
    settings.validate()?;
    let path = workspace.metadata_file("config", "console.toml")?;
    if std::fs::read_to_string(&path)? != *previous {
        return Err(error(
            "console.toml changed on disk. Restart the console to load it; file was not overwritten.",
        ));
    }
    let source = toml::to_string_pretty(settings).map_err(|e| error(e.to_string()))?;
    core::atomic_write(&path, source.as_bytes())?;
    *previous = source;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn example_and_partial_configs_are_valid() {
        let example = Settings::parse(EXAMPLE).unwrap();
        assert_eq!(example.indent, 4);
        let partial = Settings::parse(
            "indent = 3\n[colors]\naccent = '#123456'\n[bindings]\n'ctrl+j' = 'save'\n",
        )
        .unwrap();
        assert_eq!(partial.palette().unwrap().accent, Color::Rgb(18, 52, 86));
        assert!(matches!(
            partial.binding(KeyEvent::new(KeyCode::Char('j'), KeyModifiers::CONTROL)),
            Some(Command::Save)
        ));
        assert_eq!(partial.draft_delay_ms, 600);
    }
    #[test]
    fn invalid_config_fails_visibly() {
        for source in [
            "indent = 0",
            "theme = 3",
            "autosav = true",
            "poll_interval_ms = 0",
            "[colors]\naccent = 'oops'",
            "[colors]\ntypo = '#ffffff'",
            "[bindings]\nj = 'save'",
            "[bindings]\n'ctrl+j' = 'typo'",
            "indent = ",
        ] {
            assert!(Settings::parse(source).is_err(), "accepted {source}");
        }
    }
    #[test]
    fn migration_and_external_edits_preserve_user_data() {
        let dir = tempfile::tempdir().unwrap();
        let workspace = Workspace::open(dir.path()).unwrap();
        crate::preferences::save(
            &workspace,
            &serde_json::json!({"theme":"matrix", "console":{"indent":8, "theme":1}}),
        )
        .unwrap();
        let (mut settings, mut source) = load(&workspace).unwrap();
        assert_eq!(settings.indent, 8);
        settings.numbers = false;
        save(&workspace, &settings, &mut source).unwrap();
        assert!(!load(&workspace).unwrap().0.numbers);
        let path = workspace.metadata_file("config", "console.toml").unwrap();
        std::fs::write(&path, "indent = 2\n").unwrap();
        assert!(save(&workspace, &settings, &mut source).is_err());
        assert_eq!(std::fs::read_to_string(path).unwrap(), "indent = 2\n");
        assert_eq!(
            crate::preferences::load(&workspace).unwrap()["theme"],
            "matrix"
        );
    }
    #[cfg(unix)]
    #[test]
    fn config_symlink_is_rejected() {
        let dir = tempfile::tempdir().unwrap();
        let outside = tempfile::NamedTempFile::new().unwrap();
        let workspace = Workspace::open(dir.path()).unwrap();
        let path = workspace.metadata_file("config", "console.toml").unwrap();
        std::os::unix::fs::symlink(outside.path(), path).unwrap();
        assert!(load(&workspace).is_err());
    }
}
