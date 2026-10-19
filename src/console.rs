//! Keyboard-first terminal frontend. All document I/O goes through Workspace.
use crate::{
    core::{self, Draft, Save, Search, Workspace},
    runner::{RunReport, Runner},
};
use crossterm::{
    event::{
        self, DisableBracketedPaste, EnableBracketedPaste, Event, KeyCode, KeyEvent, KeyEventKind,
        KeyModifiers,
    },
    execute,
    terminal::{self, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, Clear, List, ListItem, ListState, Paragraph, Wrap},
};
use std::{
    io::{self, IsTerminal},
    path::PathBuf,
    time::{Duration, Instant},
};
use tui_textarea::{CursorMove, TextArea};

// ASCII projection of the original folded-ribbon mark in web/src/assets/codora-mono.svg.
pub const LOGO: &str = r"                    //////////
              //////////////////
        ///////////////////
    +////////////////
    +++++//////
   ++++++++
   +++++++               ###
  +++++++             #########
  +++++###              #########
   +##########         ###########
      ##########################
          #################
              #######";
const SMALL_LOGO: &str = r"           ///////
     ////////////
  +++/////
  ++++          #
 ++++         #####
  #######     #######
      ###########";

const HELP: &str = "CODORA • CONSOLE\n\nType immediately — no modes. Ctrl+E opens every command; type to filter.\n\nCtrl+N  New tab          Ctrl+P / Ctrl+O  Open file\nCtrl+S  Save             Alt+S            Save as\nCtrl+W  Close tab        Ctrl+Q           Quit\nAlt+Left / Alt+Right     Previous / next tab\nCtrl+F  Find (literal)   F3 / Shift+F3    Next / previous match\nCtrl+R  Replace all      Ctrl+G           Go to line\nCtrl+Shift+F             Workspace search (or use command palette)\nCtrl+Z / Ctrl+Y          Undo / redo\nCtrl+A                  Select all\nShift+arrows            Select text\nCtrl+C / Ctrl+X / Ctrl+V Copy / cut / paste (editor clipboard)\nCtrl+Left / Ctrl+Right   Move by word\nTab / Shift+Tab          Indent / unindent\nCtrl+Space               Complete word from open document\nF2                      File list / sidebar focus\nF4                      Markdown reading preview\nF5                      Save and run Python\nF6                      Python output panel\nF8                      Focus mode\nF1                      This help\nEsc                     Cancel / close panel\n\nDialogs: type to filter, Up/Down, PageUp/PageDown, Enter to choose.\nTerminal paste uses bracketed paste; use your terminal's paste shortcut.\nCopy/cut/paste share an internal clipboard across tabs.\n\nCommand palette also provides:\nWorkspace switching, hidden files, regex folder search, outline, rename,\nnew folder, duplicate, recoverable trash, history and draft recovery,\nMarkdown formatting, Pandoc import/export, themes, line numbers,\nindent width, autosave, Python stdin and Stop.\n\nSafety:\nSaves check disk revisions and retain previous versions. Conflicts never\noverwrite the disk. Dirty tabs write recoverable .typoha/drafts entries.\nClosing dirty tabs asks Save / Discard / Cancel. Errors appear below.\nPython runs with your user permissions, just as in the desktop editor.\n\nTerminal-specific limits:\nPreview is styled text: TeX, Mermaid, images and HTML remain source.\nPDF/PNG, printing, spellcheck, graphical colors/transparency, project LSP\nand desktop extensions are unavailable here. Pandoc is an external tool.\n";

type Result<T> = core::Result<T>;
fn error(message: impl Into<String>) -> core::Error {
    core::Error(400, message.into())
}

struct Buffer {
    editor: TextArea<'static>,
    path: Option<String>,
    revision: Option<String>,
    saved: String,
    id: String,
    dirty: bool,
    crlf: bool,
    undo_groups: Vec<usize>,
    redo_groups: Vec<usize>,
}
impl Buffer {
    fn new(path: Option<String>, content: String, revision: Option<String>) -> Self {
        // Preserve uniform CRLF documents; a mixed-ending document retains its literal CRs.
        let crlf = content.contains("\r\n") && !content.replace("\r\n", "").contains('\n');
        let text = if crlf {
            content.replace("\r\n", "\n")
        } else {
            content.clone()
        };
        let mut editor = TextArea::new(text.split('\n').map(str::to_owned).collect());
        editor.set_max_histories(500);
        Self {
            editor,
            path,
            revision,
            saved: content,
            id: format!("console-{}", uuid::Uuid::new_v4()),
            dirty: false,
            crlf,
            undo_groups: vec![],
            redo_groups: vec![],
        }
    }
    fn record(&mut self, count: usize) {
        self.undo_groups.push(count);
        if self.undo_groups.len() > 500 {
            self.undo_groups.remove(0);
        }
        self.redo_groups.clear();
    }
    fn undo(&mut self) -> bool {
        let Some(count) = self.undo_groups.pop() else {
            return false;
        };
        for _ in 0..count {
            self.editor.undo();
        }
        self.redo_groups.push(count);
        true
    }
    fn redo(&mut self) -> bool {
        let Some(count) = self.redo_groups.pop() else {
            return false;
        };
        for _ in 0..count {
            self.editor.redo();
        }
        self.undo_groups.push(count);
        true
    }
    fn text(&self) -> String {
        self.editor
            .lines()
            .join(if self.crlf { "\r\n" } else { "\n" })
    }
    fn changed(&mut self) {
        self.dirty = self.text() != self.saved;
    }
    fn title(&self) -> String {
        format!(
            "{}{}",
            self.path.as_deref().unwrap_or("Untitled"),
            if self.dirty { " *" } else { "" }
        )
    }
    fn draft(&self) -> Draft {
        Draft {
            id: self.id.clone(),
            path: self.path.clone(),
            content: self.text(),
        }
    }
}

#[derive(Clone, Copy, Debug)]
enum Command {
    New,
    Open,
    Save,
    SaveAs,
    Close,
    Quit,
    SaveAllQuit,
    Workspace,
    Find,
    Replace,
    Search,
    RegexSearch,
    Outline,
    History,
    Drafts,
    Trash,
    Rename,
    Mkdir,
    Delete,
    Duplicate,
    Run,
    Stop,
    Input,
    Output,
    Preview,
    Export,
    Import,
    Theme,
    Numbers,
    Autosave,
    Indent,
    Hidden,
    Focus,
    Help,
    Bold,
    Italic,
    Link,
    Table,
    Task,
    Code,
}
const COMMANDS: &[(Command, &str)] = &[
    (Command::New, "New document                     Ctrl+N"),
    (Command::Open, "Open file / quick open            Ctrl+P"),
    (Command::Save, "Save                             Ctrl+S"),
    (Command::SaveAs, "Save as                          Alt+S"),
    (Command::Close, "Close tab                        Ctrl+W"),
    (Command::Quit, "Quit                             Ctrl+Q"),
    (Command::Workspace, "Open workspace folder"),
    (Command::Find, "Find in document                 Ctrl+F"),
    (Command::Replace, "Replace all in document          Ctrl+R"),
    (
        Command::Search,
        "Search workspace                 Ctrl+Shift+F",
    ),
    (Command::RegexSearch, "Regex search workspace"),
    (Command::Outline, "Document outline / headings"),
    (Command::History, "Version history — open recovery copy"),
    (Command::Drafts, "Recover draft — open unsaved copy"),
    (Command::Trash, "Restore file from trash"),
    (Command::Rename, "Rename / move current file"),
    (Command::Mkdir, "Create folder"),
    (Command::Delete, "Move current file to trash"),
    (Command::Duplicate, "Duplicate document"),
    (Command::Run, "Run Python                       F5"),
    (Command::Stop, "Stop Python"),
    (Command::Input, "Send input to Python"),
    (Command::Output, "Toggle Python output             F6"),
    (Command::Preview, "Markdown reading preview         F4"),
    (Command::Export, "Export via Pandoc"),
    (Command::Import, "Import via Pandoc (workspace file)"),
    (Command::Theme, "Cycle console theme"),
    (Command::Numbers, "Toggle line numbers"),
    (Command::Autosave, "Toggle autosave (named files)"),
    (Command::Indent, "Cycle indentation: 2 / 4 / 8"),
    (Command::Hidden, "Toggle hidden files"),
    (Command::Focus, "Toggle focus mode                F8"),
    (Command::Bold, "Markdown: bold selection"),
    (Command::Italic, "Markdown: italic selection"),
    (Command::Link, "Markdown: insert link"),
    (Command::Table, "Markdown: insert table"),
    (Command::Task, "Markdown: insert task"),
    (Command::Code, "Markdown: fenced code block"),
    (Command::Help, "Help / shortcuts                 F1"),
];
#[derive(Clone)]
enum Action {
    Command(Command),
    Open(String, usize),
    History(String, String),
    Draft(String, Option<String>, String),
    Restore(String),
    Line(usize),
    Complete(String),
}
struct Picker {
    title: String,
    query: TextArea<'static>,
    items: Vec<(String, Action)>,
    selected: usize,
}
impl Picker {
    fn filtered(&self) -> Vec<usize> {
        let query = self.query.lines().join("").to_lowercase();
        let mut matches: Vec<(usize, usize)> = self
            .items
            .iter()
            .enumerate()
            .filter_map(|(i, (label, _))| {
                fuzzy_score(&query, &label.to_lowercase()).map(|score| (i, score))
            })
            .collect();
        matches.sort_by_key(|(_, score)| *score);
        matches.into_iter().map(|(i, _)| i).collect()
    }
}
fn tree_key(entry: &core::Entry) -> Vec<(bool, String)> {
    let parts: Vec<_> = entry.path.split('/').collect();
    parts
        .iter()
        .enumerate()
        .map(|(i, p)| (i == parts.len() - 1 && !entry.directory, p.to_lowercase()))
        .collect()
}
fn fuzzy_score(query: &str, label: &str) -> Option<usize> {
    let mut chars = label.char_indices();
    let mut score = 0;
    for needle in query.chars() {
        score += chars.find(|(_, c)| *c == needle)?.0;
    }
    Some(score)
}
#[derive(Clone)]
enum PromptKind {
    Open,
    SaveAs,
    Find,
    ReplaceQuery,
    ReplaceWith(String),
    Search(bool),
    Goto,
    Workspace,
    Rename,
    Mkdir,
    Input,
    ExportFormat,
    ExportPath(String),
    Import,
}
struct Prompt {
    title: String,
    input: TextArea<'static>,
    kind: PromptKind,
}
#[derive(Clone, Copy)]
enum Confirm {
    Close,
    Quit,
    Delete,
}
struct Reader {
    title: String,
    text: Text<'static>,
    scroll: u16,
}
#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(default)]
struct Settings {
    theme: usize,
    numbers: bool,
    autosave: bool,
    indent: u8,
    hidden: bool,
}
impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: 0,
            numbers: true,
            autosave: false,
            indent: 4,
            hidden: false,
        }
    }
}
struct App {
    workspace: Workspace,
    tabs: Vec<Buffer>,
    active: usize,
    picker: Option<Picker>,
    prompt: Option<Prompt>,
    confirm: Option<Confirm>,
    reader: Option<Reader>,
    settings: Settings,
    message: String,
    failed: bool,
    focus: bool,
    sidebar: bool,
    tree: Vec<core::Entry>,
    collapsed: std::collections::HashSet<String>,
    tree_index: usize,
    tree_focus: bool,
    clipboard: String,
    runner: Runner,
    report: Option<RunReport>,
    output: bool,
    edited: Instant,
    draft_pending: bool,
    quit: bool,
    save_then: Option<Command>,
}
impl App {
    fn new(workspace: Workspace) -> Result<Self> {
        let prefs = crate::preferences::load(&workspace)?;
        let tree = workspace.list(false, false)?;
        let settings = prefs
            .get("console")
            .cloned()
            .map(serde_json::from_value)
            .transpose()?
            .unwrap_or_default();
        Ok(Self {
            workspace,
            tabs: vec![],
            active: 0,
            picker: None,
            prompt: None,
            confirm: None,
            reader: None,
            tree,
            collapsed: Default::default(),
            tree_index: 0,
            tree_focus: false,
            settings,
            message: "Welcome — Ctrl+N new · Ctrl+P open · Ctrl+E commands · F1 help".into(),
            failed: false,
            focus: false,
            sidebar: true,
            clipboard: String::new(),
            runner: Runner::default(),
            report: None,
            output: false,
            edited: Instant::now(),
            draft_pending: false,
            quit: false,
            save_then: None,
        })
    }
    fn refresh_tree(&mut self) -> Result<()> {
        self.tree = self.workspace.list(self.settings.hidden, false)?;
        self.tree.sort_by_key(tree_key);
        self.tree_index = self
            .tree_index
            .min(self.visible_tree().len().saturating_sub(1));
        Ok(())
    }
    fn visible_tree(&self) -> Vec<&core::Entry> {
        self.tree
            .iter()
            .filter(|e| {
                !self
                    .collapsed
                    .iter()
                    .any(|p| e.path.starts_with(&format!("{p}/")))
            })
            .collect()
    }
    fn current(&self) -> Result<&Buffer> {
        self.tabs
            .get(self.active)
            .ok_or_else(|| error("Open or create a document first"))
    }
    fn current_mut(&mut self) -> Result<&mut Buffer> {
        self.tabs
            .get_mut(self.active)
            .ok_or_else(|| error("Open or create a document first"))
    }
    fn notice(&mut self, text: impl Into<String>) {
        self.message = text.into();
        self.failed = false;
    }
    fn fail(&mut self, e: core::Error) {
        self.message = e.1;
        self.failed = true;
    }
    fn changed(&mut self) {
        if let Some(tab) = self.tabs.get_mut(self.active) {
            tab.changed();
            tab.record(1);
        }
        self.edited = Instant::now();
        self.draft_pending = true;
    }
    fn changed_group(&mut self, count: usize) {
        self.changed();
        if let Some(tab) = self.tabs.get_mut(self.active)
            && let Some(last) = tab.undo_groups.last_mut()
        {
            *last = count;
        }
    }
    fn replayed(&mut self) {
        if let Some(tab) = self.tabs.get_mut(self.active) {
            tab.changed();
        }
        self.edited = Instant::now();
        self.draft_pending = true;
    }
    fn open(&mut self, path: &str, line: usize) -> Result<()> {
        if let Some(i) = self
            .tabs
            .iter()
            .position(|b| b.path.as_deref() == Some(path))
        {
            self.active = i;
        } else {
            let doc = self.workspace.read(path)?;
            self.tabs
                .push(Buffer::new(Some(doc.path), doc.content, Some(doc.revision)));
            self.active = self.tabs.len() - 1;
        }
        if line > 0 {
            self.current_mut()?.editor.move_cursor(CursorMove::Jump(
                (line - 1).min(u16::MAX as usize) as u16,
                0,
            ));
        }
        Ok(())
    }
    fn new_tab(&mut self, text: String) {
        self.tabs.push(Buffer::new(None, String::new(), None));
        self.active = self.tabs.len() - 1;
        if !text.is_empty() {
            self.tabs[self.active].editor.insert_str(text);
            self.changed();
        }
    }
    fn prompt(&mut self, title: &str, kind: PromptKind, initial: &str) {
        let mut input = TextArea::new(vec![initial.into()]);
        input.move_cursor(CursorMove::End);
        self.prompt = Some(Prompt {
            title: title.into(),
            input,
            kind,
        });
    }
    fn choose(&mut self, title: &str, items: Vec<(String, Action)>) {
        self.picker = Some(Picker {
            title: title.into(),
            query: TextArea::default(),
            items,
            selected: 0,
        });
    }
    fn palette(&mut self) {
        self.choose(
            "Commands · type to filter",
            COMMANDS
                .iter()
                .map(|(c, s)| (s.to_string(), Action::Command(*c)))
                .collect(),
        );
    }
    fn files(&mut self) -> Result<()> {
        let files = self
            .workspace
            .list(self.settings.hidden, false)?
            .into_iter()
            .filter(|e| !e.directory)
            .map(|e| (e.path.clone(), Action::Open(e.path, 0)))
            .collect();
        self.choose(
            "Files · Enter opens · Esc cancels · Ctrl+O enters a path",
            files,
        );
        Ok(())
    }
    fn persist_drafts(&self) -> Result<()> {
        for tab in &self.tabs {
            if tab.dirty {
                self.workspace.save_draft(&tab.draft())?;
            } else {
                self.workspace.clear_draft(&tab.id)?;
            }
        }
        Ok(())
    }
    fn save(&mut self, target: Option<String>) -> Result<bool> {
        let tab = self.current()?;
        let path = target.or_else(|| tab.path.clone());
        let Some(path) = path else {
            self.prompt("Save as · relative workspace path", PromptKind::SaveAs, "");
            return Ok(false);
        };
        if self
            .tabs
            .iter()
            .enumerate()
            .any(|(i, b)| i != self.active && b.path.as_deref() == Some(&path))
        {
            return Err(error("This file is open in another tab"));
        }
        // Persist recovery before attempting a revision-checked save.
        self.workspace.save_draft(&tab.draft())?;
        let expected_revision = if tab.path.as_deref() == Some(&path) {
            tab.revision.clone()
        } else {
            None
        };
        let doc = self.workspace.save(Save {
            path,
            content: tab.text(),
            expected_revision,
        })?;
        let tab = self.current_mut()?;
        tab.path = Some(doc.path);
        tab.revision = Some(doc.revision);
        tab.saved = doc.content;
        tab.dirty = false;
        self.workspace.clear_draft(&self.current()?.id)?;
        self.refresh_tree()?;
        self.notice("Saved");
        Ok(true)
    }
    fn close(&mut self, discard: bool) -> Result<()> {
        if self.tabs.is_empty() {
            return Ok(());
        }
        if !discard && self.current()?.dirty {
            self.confirm = Some(Confirm::Close);
            return Ok(());
        }
        self.workspace.clear_draft(&self.current()?.id)?;
        self.tabs.remove(self.active);
        self.active = self.active.min(self.tabs.len().saturating_sub(1));
        Ok(())
    }
    fn settings_changed(&mut self) -> Result<()> {
        let mut prefs = crate::preferences::load(&self.workspace)?;
        prefs["console"] = serde_json::to_value(&self.settings)?;
        crate::preferences::save(&self.workspace, &prefs)?;
        self.notice(format!(
            "Console settings saved · theme {} · indent {} · autosave {}",
            self.settings.theme + 1,
            self.settings.indent,
            self.settings.autosave
        ));
        Ok(())
    }
    fn command(&mut self, command: Command) -> Result<()> {
        match command {
            Command::New => self.new_tab(String::new()),
            Command::Open => self.files()?,
            Command::Save => {
                self.save(None)?;
            }
            Command::SaveAs => {
                let path = self.current()?.path.clone().unwrap_or_default();
                self.prompt(
                    "Save as · existing files are never overwritten",
                    PromptKind::SaveAs,
                    &path,
                );
            }
            Command::Close => self.close(false)?,
            Command::Quit => {
                self.persist_drafts()?;
                if self.tabs.iter().any(|t| t.dirty) || self.runner.is_running()? {
                    self.confirm = Some(Confirm::Quit);
                } else {
                    self.quit = true;
                }
            }
            Command::SaveAllQuit => {
                while let Some(i) = self.tabs.iter().position(|b| b.dirty) {
                    self.active = i;
                    if !self.save(None)? {
                        self.save_then = Some(Command::SaveAllQuit);
                        return Ok(());
                    }
                }
                self.quit = true;
            }
            Command::Workspace => {
                if self.tabs.iter().any(|t| t.dirty) {
                    return Err(error("Save or close dirty tabs before changing workspace"));
                }
                if self.runner.is_running()? {
                    return Err(error("Stop Python before changing workspace"));
                }
                self.prompt(
                    "Open workspace · absolute or relative folder",
                    PromptKind::Workspace,
                    "",
                );
            }
            Command::Find => self.prompt(
                "Find · literal text · F3 next / Shift+F3 previous",
                PromptKind::Find,
                "",
            ),
            Command::Replace => self.prompt(
                "Replace all · find literal text",
                PromptKind::ReplaceQuery,
                "",
            ),
            Command::Search => self.prompt(
                "Search workspace · literal text",
                PromptKind::Search(false),
                "",
            ),
            Command::RegexSearch => self.prompt(
                "Search workspace · regular expression",
                PromptKind::Search(true),
                "",
            ),
            Command::Outline => {
                let items = self
                    .current()?
                    .editor
                    .lines()
                    .iter()
                    .enumerate()
                    .filter_map(|(i, line)| {
                        let trimmed = line.trim_start();
                        (trimmed.starts_with('#')
                            && trimmed.trim_start_matches('#').starts_with(' '))
                        .then(|| (format!("{}  {}", i + 1, line), Action::Line(i)))
                    })
                    .collect();
                self.choose("Outline", items);
            }
            Command::History => {
                let path = self
                    .current()?
                    .path
                    .clone()
                    .ok_or_else(|| error("Save this document first"))?;
                let items = self
                    .workspace
                    .history(&path)?
                    .into_iter()
                    .map(|s| {
                        (
                            format!("{}  {} bytes", s.id, s.bytes),
                            Action::History(path.clone(), s.id),
                        )
                    })
                    .collect();
                self.choose("History · opens an unsaved copy", items);
            }
            Command::Drafts => {
                let items = self
                    .workspace
                    .drafts()?
                    .into_iter()
                    .map(|d| {
                        (
                            format!(
                                "{} · {} bytes · {}",
                                d.path.as_deref().unwrap_or("Untitled"),
                                d.content.len(),
                                d.id
                            ),
                            Action::Draft(d.id, d.path, d.content),
                        )
                    })
                    .collect();
                self.choose("Recover draft · opens an unsaved copy", items);
            }
            Command::Trash => {
                let items = self
                    .workspace
                    .trash_list()?
                    .into_iter()
                    .map(|e| (format!("{} · {}", e.path, e.id), Action::Restore(e.id)))
                    .collect();
                self.choose("Trash · Enter restores", items);
            }
            Command::Rename => {
                let path = self
                    .current()?
                    .path
                    .clone()
                    .ok_or_else(|| error("Save this document first"))?;
                self.prompt(
                    "Rename / move · new relative path",
                    PromptKind::Rename,
                    &path,
                );
            }
            Command::Mkdir => self.prompt(
                "New folder · relative workspace path",
                PromptKind::Mkdir,
                "",
            ),
            Command::Delete => {
                self.current()?;
                self.confirm = Some(Confirm::Delete);
            }
            Command::Duplicate => {
                let text = self.current()?.text();
                self.new_tab(text);
                self.prompt("Save duplicate as", PromptKind::SaveAs, "");
            }
            Command::Run => {
                if self.runner.is_running()? {
                    self.output = true;
                    self.notice("Python already running · Ctrl+E → Send input / Stop Python");
                } else if self.save(None)? {
                    let tab = self.current()?;
                    self.report = Some(self.runner.start(
                        &self.workspace,
                        tab.path.as_deref().unwrap(),
                        tab.revision.as_deref().unwrap(),
                    )?);
                    self.output = true;
                    self.notice("Python started · Ctrl+E → Send input / Stop Python");
                } else {
                    self.save_then = Some(Command::Run);
                }
            }
            Command::Stop => {
                if let Some(report) = &self.report {
                    self.runner.send(&self.workspace, &report.id, None)?;
                    self.notice("Stop requested");
                }
            }
            Command::Input => {
                self.prompt("Python stdin · Enter sends a line", PromptKind::Input, "")
            }
            Command::Output => self.output = !self.output,
            Command::Preview => {
                let text = markdown_preview(&self.current()?.text());
                self.reader = Some(Reader {
                    title: "Markdown · text preview · Esc closes".into(),
                    text,
                    scroll: 0,
                });
            }
            Command::Export => self.prompt(
                "Pandoc export format · html/docx/odt/rtf/epub/latex/rst/commonmark",
                PromptKind::ExportFormat,
                "html",
            ),
            Command::Import => self.prompt(
                "Import workspace file · docx/odt/rtf/epub/html/rst/latex",
                PromptKind::Import,
                "",
            ),
            Command::Theme => {
                self.settings.theme = (self.settings.theme + 1) % 3;
                self.settings_changed()?;
            }
            Command::Numbers => {
                self.settings.numbers = !self.settings.numbers;
                self.settings_changed()?;
            }
            Command::Autosave => {
                self.settings.autosave = !self.settings.autosave;
                self.settings_changed()?;
            }
            Command::Indent => {
                self.settings.indent = match self.settings.indent {
                    2 => 4,
                    4 => 8,
                    _ => 2,
                };
                self.settings_changed()?;
            }
            Command::Hidden => {
                self.settings.hidden = !self.settings.hidden;
                self.refresh_tree()?;
                self.settings_changed()?;
            }
            Command::Focus => self.focus = !self.focus,
            Command::Help => {
                self.reader = Some(Reader {
                    title: "Help · arrows / PgUp / PgDn · Esc closes".into(),
                    text: Text::raw(HELP),
                    scroll: 0,
                })
            }
            Command::Bold | Command::Italic => {
                let tab = self.current_mut()?;
                let marker = if matches!(command, Command::Bold) {
                    "**"
                } else {
                    "*"
                };
                let selected = tab.editor.selection_range().is_some_and(|(a, b)| a != b);
                let content = if selected {
                    tab.editor.copy();
                    tab.editor.yank_text()
                } else {
                    "text".into()
                };
                tab.editor.insert_str(format!("{marker}{content}{marker}"));
                self.changed_group(if selected { 2 } else { 1 });
            }
            Command::Link | Command::Table | Command::Task | Command::Code => {
                let text = match command {
                    Command::Link => "[text](url)",
                    Command::Table => "\n| Column | Column |\n| --- | --- |\n| Value | Value |\n",
                    Command::Task => "- [ ] ",
                    _ => "\n```\n\n```\n",
                };
                let editor = &mut self.current_mut()?.editor;
                let selected = editor.selection_range().is_some_and(|(a, b)| a != b);
                editor.insert_str(text);
                self.changed_group(if selected { 2 } else { 1 });
            }
        }
        Ok(())
    }
    async fn submit(&mut self, prompt: Prompt) -> Result<()> {
        let value = prompt.input.lines().join("");
        match prompt.kind {
            PromptKind::Open => self.open(&value, 0)?,
            PromptKind::SaveAs => {
                if value.is_empty() {
                    return Err(error("A file name is required"));
                }
                self.save(Some(value))?;
                if let Some(command) = self.save_then.take() {
                    self.command(command)?;
                }
            }
            PromptKind::Find => {
                let tab = self.current_mut()?;
                tab.editor
                    .set_search_pattern(regex::escape(&value))
                    .map_err(|e| error(e.to_string()))?;
                let found = tab.editor.search_forward(true);
                self.notice(if found {
                    "Match found · F3 next"
                } else {
                    "No matches"
                });
            }
            PromptKind::ReplaceQuery => {
                if value.is_empty() {
                    return Err(error("Find text cannot be empty"));
                }
                self.prompt(
                    "Replace all with · empty replacement is allowed",
                    PromptKind::ReplaceWith(value),
                    "",
                );
            }
            PromptKind::ReplaceWith(query) => {
                let tab = self.current_mut()?;
                let text = tab.text();
                if !tab.crlf && text.contains('\r') {
                    return Err(error(
                        "Mixed line endings: replace individual selections to retain their original endings",
                    ));
                }
                let count = text.matches(&query).count();
                if count > 0 {
                    let replacement = text.replace(&query, &value);
                    let steps = if replacement.is_empty() { 1 } else { 2 };
                    tab.editor.select_all();
                    tab.editor.insert_str(replacement.replace("\r\n", "\n"));
                    self.changed_group(steps);
                }
                self.notice(format!("Replaced {count} occurrences · Ctrl+Z undoes"));
            }
            PromptKind::Search(regex) => {
                let hits = self.workspace.search(&Search {
                    query: value,
                    regex,
                    case_sensitive: false,
                    whole_word: false,
                })?;
                self.choose(
                    "Search results · Enter opens at line",
                    hits.into_iter()
                        .map(|h| {
                            (
                                format!("{}:{}  {}", h.path, h.line, h.text),
                                Action::Open(h.path, h.line),
                            )
                        })
                        .collect(),
                );
            }
            PromptKind::Goto => {
                let line = value
                    .parse::<usize>()
                    .map_err(|_| error("Enter a positive line number"))?
                    .saturating_sub(1);
                self.current_mut()?
                    .editor
                    .move_cursor(CursorMove::Jump(line.min(u16::MAX as usize) as u16, 0));
            }
            PromptKind::Workspace => {
                if self.tabs.iter().any(|b| b.dirty) || self.runner.is_running()? {
                    return Err(error("Save documents and stop Python first"));
                }
                self.workspace.change_root(PathBuf::from(value))?;
                self.tabs.clear();
                self.active = 0;
                self.settings = crate::preferences::load(&self.workspace)?
                    .get("console")
                    .cloned()
                    .map(serde_json::from_value)
                    .transpose()?
                    .unwrap_or_default();
                self.report = None;
                self.collapsed.clear();
                self.refresh_tree()?;
                self.notice("Workspace changed");
            }
            PromptKind::Rename => {
                let old = self
                    .current()?
                    .path
                    .clone()
                    .ok_or_else(|| error("Save first"))?;
                if self
                    .tabs
                    .iter()
                    .enumerate()
                    .any(|(i, b)| i != self.active && b.path.as_deref() == Some(&value))
                {
                    return Err(error("Destination open in another tab"));
                }
                self.workspace.rename(&old, &value)?;
                self.current_mut()?.path = Some(value);
                self.persist_drafts()?;
                self.refresh_tree()?;
                self.notice("Renamed · previous history remains at the original path");
            }
            PromptKind::Mkdir => {
                self.workspace.mkdir(&value)?;
                self.refresh_tree()?;
                self.notice("Folder created");
            }
            PromptKind::Input => {
                let report = self
                    .report
                    .as_ref()
                    .ok_or_else(|| error("No Python process"))?;
                self.runner.send(&self.workspace, &report.id, Some(value))?;
                self.output = true;
            }
            PromptKind::ExportFormat => {
                if ![
                    "docx",
                    "odt",
                    "rtf",
                    "epub",
                    "latex",
                    "mediawiki",
                    "rst",
                    "textile",
                    "opml",
                    "revealjs",
                    "commonmark",
                    "html",
                ]
                .contains(&value.as_str())
                {
                    return Err(error("Unsupported export format"));
                }
                let suggested = format!("export.{value}");
                self.prompt(
                    "Export to new workspace file · never overwrites",
                    PromptKind::ExportPath(value),
                    &suggested,
                );
            }
            PromptKind::ExportPath(format) => {
                let path = self.workspace.resolve(&value)?;
                if path.exists() {
                    return Err(error("Export destination already exists"));
                }
                let bytes = crate::conversion::convert(
                    self.current()?.text().into_bytes(),
                    "markdown".into(),
                    format,
                )
                .await?;
                // create_new closes the conversion-time race; exports never replace user files.
                use std::io::Write;
                let mut file = std::fs::OpenOptions::new()
                    .write(true)
                    .create_new(true)
                    .open(path)?;
                file.write_all(&bytes)?;
                file.sync_all()?;
                self.notice("Exported");
            }
            PromptKind::Import => {
                let path = self.workspace.resolve(&value)?;
                if std::fs::metadata(&path)?.len() > core::MAX_DOCUMENT {
                    return Err(error("Import is larger than 16 MB"));
                }
                let format = path
                    .extension()
                    .and_then(|s| s.to_str())
                    .unwrap_or("")
                    .to_ascii_lowercase();
                if ![
                    "docx",
                    "odt",
                    "rtf",
                    "epub",
                    "html",
                    "rst",
                    "latex",
                    "mediawiki",
                ]
                .contains(&format.as_str())
                {
                    return Err(error("Unsupported import format"));
                }
                let bytes =
                    crate::conversion::convert(std::fs::read(path)?, format, "markdown".into())
                        .await?;
                self.new_tab(
                    String::from_utf8(bytes).map_err(|_| error("Import output is not UTF-8"))?,
                );
            }
        }
        Ok(())
    }
    fn action(&mut self, action: Action) -> Result<()> {
        match action {
            Action::Command(c) => self.command(c)?,
            Action::Open(path, line) => self.open(&path, line)?,
            Action::History(path, id) => {
                let text = self.workspace.snapshot(&path, &id)?;
                self.new_tab(text);
                self.notice("History opened as an unsaved copy · Save as to keep it");
            }
            Action::Draft(id, path, text) => {
                // Keep the original recovery entry until the user explicitly saves/discards it.
                if self.tabs.iter().any(|b| b.id == id) {
                    return Err(error("This draft is already open"));
                }
                self.new_tab(text);
                let tab = self.current_mut()?;
                tab.id = id;
                tab.dirty = true;
                self.notice(format!(
                    "Recovered {} as an unsaved copy",
                    path.as_deref().unwrap_or("Untitled")
                ));
            }
            Action::Restore(id) => {
                let path = self.workspace.restore(&id)?;
                self.refresh_tree()?;
                self.notice(format!("Restored {path}"));
            }
            Action::Line(line) => self
                .current_mut()?
                .editor
                .move_cursor(CursorMove::Jump(line.min(u16::MAX as usize) as u16, 0)),
            Action::Complete(suffix) => {
                let editor = &mut self.current_mut()?.editor;
                let selected = editor.selection_range().is_some_and(|(a, b)| a != b);
                editor.insert_str(suffix);
                self.changed_group(if selected { 2 } else { 1 });
            }
        }
        Ok(())
    }
    fn complete(&mut self) -> Result<()> {
        let tab = self.current()?;
        let (row, col) = tab.editor.cursor();
        let prefix: String = tab.editor.lines()[row]
            .chars()
            .take(col)
            .collect::<String>()
            .chars()
            .rev()
            .take_while(|c| c.is_alphanumeric() || *c == '_')
            .collect::<String>()
            .chars()
            .rev()
            .collect();
        if prefix.is_empty() {
            return Ok(());
        }
        let mut words: Vec<String> = tab
            .editor
            .lines()
            .iter()
            .flat_map(|l| l.split(|c: char| !c.is_alphanumeric() && c != '_'))
            .filter(|w| w.starts_with(&prefix) && w.len() > prefix.len())
            .map(str::to_owned)
            .collect();
        words.sort();
        words.dedup();
        words.truncate(200);
        self.choose(
            "Complete word",
            words
                .into_iter()
                .map(|w| {
                    let suffix = w[prefix.len()..].to_owned();
                    (w, Action::Complete(suffix))
                })
                .collect(),
        );
        Ok(())
    }
    async fn key(&mut self, key: KeyEvent) -> Result<()> {
        if let Some(confirm) = self.confirm.take() {
            match key.code {
                KeyCode::Esc | KeyCode::Char('c' | 'C') => {
                    self.save_then = None;
                    self.notice("Cancelled · Ctrl+E commands · F1 help");
                }
                KeyCode::Char('s' | 'S') if !matches!(confirm, Confirm::Delete) => match confirm {
                    Confirm::Close => {
                        if self.save(None)? {
                            self.close(true)?;
                        } else {
                            self.save_then = Some(Command::Close);
                        }
                    }
                    Confirm::Quit => {
                        if self.runner.is_running()? {
                            return Err(error("Stop Python before saving and quitting"));
                        }
                        self.command(Command::SaveAllQuit)?;
                    }
                    _ => {}
                },
                KeyCode::Char('d' | 'D') if !matches!(confirm, Confirm::Delete) => {
                    if matches!(confirm, Confirm::Close) {
                        self.close(true)?;
                    } else {
                        for tab in &self.tabs {
                            self.workspace.clear_draft(&tab.id)?;
                        }
                        self.quit = true;
                    }
                }
                KeyCode::Char('y' | 'Y') if matches!(confirm, Confirm::Delete) => {
                    let path = self
                        .current()?
                        .path
                        .clone()
                        .ok_or_else(|| error("No saved file to trash"))?;
                    self.workspace.trash(&path)?;
                    self.close(true)?;
                    self.refresh_tree()?;
                    self.notice("Moved to recoverable trash");
                }
                _ => self.confirm = Some(confirm),
            }
            return Ok(());
        }
        if let Some(mut prompt) = self.prompt.take() {
            match key.code {
                KeyCode::Esc => {
                    self.save_then = None;
                }
                KeyCode::Enter => self.submit(prompt).await?,
                _ => {
                    single_line_input(&mut prompt.input, key);
                    self.prompt = Some(prompt);
                }
            }
            return Ok(());
        }
        if let Some(mut picker) = self.picker.take() {
            let filtered = picker.filtered();
            match key.code {
                KeyCode::Esc => {}
                KeyCode::Up => {
                    picker.selected = picker.selected.saturating_sub(1);
                    self.picker = Some(picker);
                }
                KeyCode::Down => {
                    picker.selected = (picker.selected + 1).min(filtered.len().saturating_sub(1));
                    self.picker = Some(picker);
                }
                KeyCode::PageUp => {
                    picker.selected = picker.selected.saturating_sub(10);
                    self.picker = Some(picker);
                }
                KeyCode::PageDown => {
                    picker.selected = (picker.selected + 10).min(filtered.len().saturating_sub(1));
                    self.picker = Some(picker);
                }
                KeyCode::Enter => {
                    if let Some(i) = filtered.get(picker.selected) {
                        self.action(picker.items[*i].1.clone())?;
                    }
                }
                KeyCode::Char('o') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                    self.prompt("Open · relative workspace path", PromptKind::Open, "")
                }
                _ => {
                    single_line_input(&mut picker.query, key);
                    picker.selected = 0;
                    self.picker = Some(picker);
                }
            }
            return Ok(());
        }
        if let Some(reader) = self.reader.as_mut() {
            match key.code {
                KeyCode::Esc | KeyCode::F(4) | KeyCode::F(1) => self.reader = None,
                KeyCode::Down => reader.scroll = reader.scroll.saturating_add(1),
                KeyCode::Up => reader.scroll = reader.scroll.saturating_sub(1),
                KeyCode::PageDown => reader.scroll = reader.scroll.saturating_add(15),
                KeyCode::PageUp => reader.scroll = reader.scroll.saturating_sub(15),
                KeyCode::Home => reader.scroll = 0,
                _ => {}
            }
            return Ok(());
        }
        let ctrl = key.modifiers.contains(KeyModifiers::CONTROL);
        let alt = key.modifiers.contains(KeyModifiers::ALT);
        let shift = key.modifiers.contains(KeyModifiers::SHIFT);
        let command = match key.code {
            KeyCode::Char('q') if ctrl => Some(Command::Quit),
            KeyCode::Char('s') if ctrl => Some(Command::Save),
            KeyCode::Char('s') if alt => Some(Command::SaveAs),
            KeyCode::Char('n') if ctrl => Some(Command::New),
            KeyCode::Char('w') if ctrl => Some(Command::Close),
            KeyCode::Char('p' | 'o') if ctrl => Some(Command::Open),
            KeyCode::Char('f' | 'F') if ctrl && shift => Some(Command::Search),
            KeyCode::Char('f') if ctrl => Some(Command::Find),
            KeyCode::Char('r') if ctrl => Some(Command::Replace),
            KeyCode::F(1) => Some(Command::Help),

            KeyCode::F(4) => Some(Command::Preview),
            KeyCode::F(5) => Some(Command::Run),
            KeyCode::F(6) => Some(Command::Output),
            KeyCode::F(8) => Some(Command::Focus),
            _ => None,
        };
        if let Some(command) = command {
            self.command(command)?;
            return Ok(());
        }
        if key.code == KeyCode::F(2) {
            self.refresh_tree()?;
            if terminal::size().map(|s| s.0).unwrap_or(0) < 70 {
                self.files()?;
                return Ok(());
            }
            self.tree_focus = !self.tree_focus;
            self.sidebar = true;
            self.focus = false;
            return Ok(());
        }
        if self.tree_focus {
            let visible = self.visible_tree();
            match key.code {
                KeyCode::Esc => self.tree_focus = false,
                KeyCode::Up => self.tree_index = self.tree_index.saturating_sub(1),
                KeyCode::Down => {
                    self.tree_index = (self.tree_index + 1).min(visible.len().saturating_sub(1))
                }
                KeyCode::Enter | KeyCode::Right | KeyCode::Left => {
                    if let Some(entry) = visible.get(self.tree_index) {
                        let path = entry.path.clone();
                        let directory = entry.directory;
                        if directory {
                            if !self.collapsed.remove(&path) {
                                self.collapsed.insert(path);
                            }
                        } else if key.code == KeyCode::Enter {
                            self.open(&path, 0)?;
                            self.tree_focus = false;
                        }
                    }
                }
                _ => {}
            }
            return Ok(());
        }
        match key.code {
            KeyCode::Char('e') if ctrl => self.palette(),
            KeyCode::Char('z' | 'u') if ctrl => {
                if self.current_mut()?.undo() {
                    self.replayed();
                }
            }
            KeyCode::Char('y') if ctrl => {
                if self.current_mut()?.redo() {
                    self.replayed();
                }
            }
            KeyCode::Char('g') if ctrl => self.prompt("Go to line", PromptKind::Goto, ""),
            KeyCode::Char(' ') if ctrl => self.complete()?,
            KeyCode::Left | KeyCode::Right if alt && !self.tabs.is_empty() => {
                self.persist_drafts()?;
                self.active = if key.code == KeyCode::Right {
                    (self.active + 1) % self.tabs.len()
                } else {
                    (self.active + self.tabs.len() - 1) % self.tabs.len()
                };
            }
            KeyCode::Esc => {
                self.output = false;
                self.notice("Ctrl+E commands · F1 help");
            }
            KeyCode::F(3) => {
                let found = if shift {
                    self.current_mut()?.editor.search_back(false)
                } else {
                    self.current_mut()?.editor.search_forward(false)
                };
                self.notice(if found {
                    "Match found"
                } else {
                    "No matches · Ctrl+F to search"
                });
            }
            _ => {
                if self.tabs.is_empty() {
                    return Ok(());
                }
                let clipboard = self.clipboard.clone();
                let indent = self.settings.indent;
                let editor = &mut self.current_mut()?.editor;
                let selected = editor.selection_range().is_some_and(|(a, b)| a != b);
                let insertion = matches!(key.code, KeyCode::Enter | KeyCode::Tab)
                    || matches!(key.code,KeyCode::Char(_) if !ctrl&&!alt)
                    || matches!(key.code,KeyCode::Char('v') if ctrl&&!clipboard.is_empty());
                let mut steps = if selected && insertion { 2 } else { 1 };
                let changed = match key.code {
                    KeyCode::Char('c') if ctrl => {
                        editor.copy();
                        self.clipboard = editor.yank_text();
                        false
                    }
                    KeyCode::Char('x') if ctrl => {
                        let changed = editor.cut();
                        self.clipboard = editor.yank_text();
                        changed
                    }
                    KeyCode::Char('v') if ctrl => {
                        editor.set_yank_text(clipboard);
                        editor.paste()
                    }
                    KeyCode::Char('a') if ctrl => {
                        editor.select_all();
                        false
                    }
                    KeyCode::Enter => {
                        let (row, col) = editor.cursor();
                        let padding: String = editor.lines()[row]
                            .chars()
                            .take(col)
                            .take_while(|c| *c == ' ' || *c == '\t')
                            .collect();
                        editor.insert_str(format!("\n{padding}"))
                    }
                    KeyCode::BackTab => {
                        let (row, col) = editor.cursor();
                        let count = editor.lines()[row]
                            .chars()
                            .take(indent as usize)
                            .take_while(|c| *c == ' ')
                            .count();
                        if count > 0 {
                            steps = count;
                            editor.cancel_selection();
                            editor.move_cursor(CursorMove::Jump(
                                row.min(u16::MAX as usize) as u16,
                                0,
                            ));
                            for _ in 0..count {
                                editor.delete_next_char();
                            }
                            editor.move_cursor(CursorMove::Jump(
                                row.min(u16::MAX as usize) as u16,
                                col.saturating_sub(count).min(u16::MAX as usize) as u16,
                            ));
                            true
                        } else {
                            false
                        }
                    }
                    _ => editor.input(key),
                };
                if changed {
                    self.changed_group(steps);
                }
            }
        }
        Ok(())
    }
    fn tick(&mut self) -> Result<()> {
        if let Some(report) = &self.report {
            self.report = Some(self.runner.report(&self.workspace, &report.id)?);
        }
        if self.draft_pending && self.edited.elapsed() > Duration::from_millis(600) {
            // Do not clear pending until persistence succeeds.
            self.persist_drafts()?;
            self.draft_pending = false;
        }
        if self.settings.autosave
            && self.edited.elapsed() > Duration::from_secs(2)
            && let Some(tab) = self.tabs.get(self.active)
            && tab.dirty
            && tab.path.is_some()
        {
            // One failed autosave disables retries until the user explicitly re-enables it.
            if let Err(e) = self.save(None) {
                self.settings.autosave = false;
                return Err(e);
            }
        }
        Ok(())
    }
}
fn single_line_input(input: &mut TextArea<'static>, key: KeyEvent) {
    if key.code != KeyCode::Enter
        && !(key.modifiers.contains(KeyModifiers::CONTROL)
            && matches!(key.code, KeyCode::Char('m' | 'j')))
    {
        input.input(key);
    }
}

#[derive(Clone, Copy)]
struct Palette {
    bg: Color,
    fg: Color,
    muted: Color,
    accent: Color,
    panel: Color,
}
fn colors(theme: usize) -> Palette {
    match theme % 3 {
        1 => Palette {
            bg: Color::Rgb(245, 241, 229),
            fg: Color::Rgb(47, 51, 47),
            muted: Color::Rgb(109, 116, 106),
            accent: Color::Rgb(0, 116, 101),
            panel: Color::Rgb(228, 224, 211),
        },
        2 => Palette {
            bg: Color::Reset,
            fg: Color::Reset,
            muted: Color::DarkGray,
            accent: Color::Cyan,
            panel: Color::Reset,
        },
        _ => Palette {
            bg: Color::Rgb(18, 25, 29),
            fg: Color::Rgb(220, 228, 227),
            muted: Color::Rgb(111, 139, 143),
            accent: Color::Rgb(116, 224, 180),
            panel: Color::Rgb(29, 40, 45),
        },
    }
}
fn panel(title: impl Into<Line<'static>>, p: Palette) -> Block<'static> {
    Block::default()
        .borders(Borders::ALL)
        .title(title)
        .border_style(Style::default().fg(p.muted))
        .style(Style::default().fg(p.fg).bg(p.bg))
}
fn popup(area: Rect, width: u16, height: u16) -> Rect {
    let w = width.min(area.width.saturating_sub(2));
    let h = height.min(area.height.saturating_sub(2));
    Rect::new(
        area.x + (area.width - w) / 2,
        area.y + (area.height - h) / 2,
        w,
        h,
    )
}
fn safe_text(value: &str) -> String {
    value
        .chars()
        .filter(|c| !c.is_control() || *c == '\n' || *c == '\t')
        .collect()
}
fn draw(frame: &mut Frame<'_>, app: &mut App) {
    let p = colors(app.settings.theme);
    let area = frame.area();
    frame.render_widget(
        Block::default().style(Style::default().bg(p.bg).fg(p.fg)),
        area,
    );
    if area.width < 30 || area.height < 10 {
        frame.render_widget(
            Paragraph::new("Codora · enlarge terminal to at least 30 × 10")
                .wrap(Wrap { trim: false }),
            area,
        );
        return;
    }
    let parts = Layout::vertical([
        Constraint::Length(1),
        Constraint::Length(1),
        Constraint::Min(1),
        Constraint::Length(1),
        Constraint::Length(1),
    ])
    .split(area);
    frame.render_widget(
        Paragraph::new(Line::from(vec![
            Span::styled(" ◇ CODORA ", Style::default().fg(p.accent).bold()),
            Span::styled(
                format!(
                    " CONSOLE  ·  {}",
                    safe_text(&app.workspace.root.display().to_string())
                ),
                Style::default().fg(p.muted),
            ),
        ]))
        .style(Style::default().bg(p.panel)),
        parts[0],
    );
    let tabs = if app.tabs.is_empty() {
        " Welcome ".into()
    } else {
        app.tabs
            .iter()
            .enumerate()
            .map(|(i, t)| {
                format!(
                    " {}{}{} ",
                    if i == app.active { "[" } else { " " },
                    safe_text(&t.title()),
                    if i == app.active { "]" } else { " " }
                )
            })
            .collect::<Vec<_>>()
            .join("│")
    };
    frame.render_widget(
        Paragraph::new(tabs).style(Style::default().fg(p.accent).bg(p.panel)),
        parts[1],
    );
    let body = if app.output {
        Layout::vertical([Constraint::Percentage(68), Constraint::Percentage(32)]).split(parts[2])
    } else {
        Layout::vertical([Constraint::Percentage(100), Constraint::Length(0)]).split(parts[2])
    };
    let columns = if app.sidebar
        && !app.focus
        && (!app.tabs.is_empty() || app.tree_focus)
        && area.width >= 70
    {
        Layout::horizontal([Constraint::Length(26), Constraint::Min(1)]).split(body[0])
    } else {
        Layout::horizontal([Constraint::Length(0), Constraint::Min(1)]).split(body[0])
    };
    if columns[0].width > 0 {
        let visible = app.visible_tree();
        let items: Vec<_> = visible
            .iter()
            .map(|entry| {
                let indent = "  ".repeat(entry.path.matches('/').count());
                let icon = if entry.directory {
                    if app.collapsed.contains(&entry.path) {
                        "+"
                    } else {
                        "-"
                    }
                } else {
                    " "
                };
                ListItem::new(format!("{indent}{icon} {}", safe_text(&entry.name)))
            })
            .collect();
        let mut state = ListState::default().with_selected(if app.tree_focus {
            Some(app.tree_index)
        } else {
            None
        });
        frame.render_stateful_widget(
            List::new(items)
                .block(panel(
                    if app.tree_focus {
                        " Files · F2 editor "
                    } else {
                        " Files · F2 browse "
                    },
                    p,
                ))
                .highlight_style(Style::default().fg(p.bg).bg(p.accent)),
            columns[0],
            &mut state,
        );
    }
    if let Some(tab) = app.tabs.get_mut(app.active) {
        tab.editor.set_style(Style::default().fg(p.fg).bg(p.bg));
        tab.editor
            .set_cursor_line_style(Style::default().bg(p.panel));
        tab.editor
            .set_cursor_style(Style::default().fg(p.bg).bg(p.accent));
        tab.editor
            .set_selection_style(Style::default().fg(p.bg).bg(p.accent));
        tab.editor.set_tab_length(match app.settings.indent {
            2 | 4 | 8 => app.settings.indent,
            _ => 4,
        });
        if app.settings.numbers {
            tab.editor
                .set_line_number_style(Style::default().fg(p.muted));
        } else {
            tab.editor.remove_line_number();
        }
        tab.editor
            .set_block(panel(format!(" {} ", safe_text(&tab.title())), p));
        frame.render_widget(&tab.editor, columns[1]);
        let (row, col) = tab.editor.cursor();
        let words = tab
            .editor
            .lines()
            .iter()
            .map(|l| l.split_whitespace().count())
            .sum::<usize>();
        let ext = tab
            .path
            .as_deref()
            .and_then(|s| s.rsplit('.').next())
            .unwrap_or("text");
        let status = format!(
            " {} · {}:{}  │ {} lines · {} words │ UTF-8{} │ indent {} │ autosave {}",
            ext,
            row + 1,
            col + 1,
            tab.editor.lines().len(),
            words,
            if tab.crlf { " CRLF" } else { "" },
            app.settings.indent,
            if app.settings.autosave { "on" } else { "off" }
        );
        frame.render_widget(
            Paragraph::new(status).style(Style::default().fg(p.muted).bg(p.panel)),
            parts[3],
        );
    } else {
        let logo = if columns[1].width >= 44 && columns[1].height >= 27 {
            LOGO
        } else {
            SMALL_LOGO
        };
        let width = logo.lines().map(str::len).max().unwrap_or(0);
        let mut lines = vec![Line::default()];
        for row in logo.lines() {
            let padded = format!("{row:width$}");
            let spans = padded
                .chars()
                .map(|ch| {
                    let color = match ch {
                        '/' => Color::Rgb(255, 194, 138),
                        '+' => Color::Rgb(199, 67, 89),
                        '#' => Color::Rgb(243, 106, 82),
                        _ => p.fg,
                    };
                    Span::styled(ch.to_string(), Style::default().fg(color).bold())
                })
                .collect::<Vec<_>>();
            lines.push(Line::from(spans));
        }
        lines.extend(Text::raw("\nYour files. Your terminal.\n\nCtrl+N   Create a document\nCtrl+P   Open a file\nCtrl+E   Command palette\nF1       Keyboard guide\n\nMarkdown · Code · Local Python").lines);
        if columns[1].height >= 27 {
            lines.extend(Text::raw("\nNo account. No telemetry. Just your workspace.").lines);
        }
        frame.render_widget(
            Paragraph::new(Text::from(lines))
                .alignment(Alignment::Center)
                .style(Style::default().fg(p.fg))
                .wrap(Wrap { trim: false }),
            columns[1],
        );
    }
    if app.output {
        let (title, text) = if let Some(report) = &app.report {
            (
                format!(
                    " Python · {} · {}{} · Ctrl+E: input / stop · F6 hides ",
                    safe_text(&report.path),
                    if report.finished {
                        report
                            .exit_code
                            .map(|code| format!("exit {code}"))
                            .unwrap_or_else(|| "terminated".into())
                    } else {
                        "running".into()
                    },
                    if report.truncated {
                        " · output truncated"
                    } else {
                        ""
                    }
                ),
                format!(
                    "{}{}{}",
                    safe_text(&report.stdout),
                    if report.stderr.is_empty() {
                        ""
                    } else {
                        "\n[stderr]\n"
                    },
                    safe_text(&report.stderr)
                ),
            )
        } else {
            (
                " Python output ".into(),
                "F5 runs the saved Python file. Ctrl+E → Send input / Stop Python".into(),
            )
        };
        let count = text.lines().count();
        let scroll = count
            .saturating_sub(body[1].height.saturating_sub(2) as usize)
            .min(u16::MAX as usize) as u16;
        frame.render_widget(
            Paragraph::new(text)
                .block(panel(title, p))
                .scroll((scroll, 0)),
            body[1],
        );
    }
    frame.render_widget(
        Paragraph::new(format!(" {}", safe_text(&app.message))).style(
            Style::default()
                .fg(if app.failed { Color::LightRed } else { p.fg })
                .bg(p.panel),
        ),
        parts[4],
    );
    if let Some(reader) = &app.reader {
        let rect = popup(
            area,
            area.width.saturating_sub(4),
            area.height.saturating_sub(2),
        );
        frame.render_widget(Clear, rect);
        frame.render_widget(
            Paragraph::new(reader.text.clone())
                .block(panel(format!(" {} ", reader.title), p))
                .wrap(Wrap { trim: false })
                .scroll((reader.scroll, 0)),
            rect,
        );
    }
    if let Some(picker) = &app.picker {
        let rect = popup(area, 86, 22);
        frame.render_widget(Clear, rect);
        frame.render_widget(panel(format!(" {} ", picker.title), p), rect);
        let inner = rect.inner(Margin::new(1, 1));
        let rows = Layout::vertical([
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Min(1),
        ])
        .split(inner);
        frame.render_widget(&picker.query, rows[0]);
        let filtered = picker.filtered();
        frame.render_widget(
            Paragraph::new(format!(
                "{} results · ↑↓ select · Enter choose · Esc cancel",
                filtered.len()
            ))
            .style(Style::default().fg(p.muted)),
            rows[1],
        );
        let items: Vec<_> = filtered
            .iter()
            .map(|i| ListItem::new(safe_text(&picker.items[*i].0)))
            .collect();
        let mut state = ListState::default().with_selected(Some(picker.selected));
        frame.render_stateful_widget(
            List::new(items)
                .highlight_style(Style::default().bg(p.accent).fg(p.bg))
                .highlight_symbol("› "),
            rows[2],
            &mut state,
        );
    }
    if let Some(prompt) = &app.prompt {
        let rect = popup(area, 90, 5);
        frame.render_widget(Clear, rect);
        frame.render_widget(panel(format!(" {} ", prompt.title), p), rect);
        let inner = rect.inner(Margin::new(1, 1));
        frame.render_widget(&prompt.input, Rect::new(inner.x, inner.y, inner.width, 1));
        frame.render_widget(
            Paragraph::new("Enter confirm · Esc cancel").style(Style::default().fg(p.muted)),
            Rect::new(inner.x, inner.y + 1, inner.width, 1),
        );
    }
    if let Some(confirm) = app.confirm {
        let message = match confirm {
            Confirm::Close => "Unsaved changes\n\n[S] Save   [D] Discard   [C / Esc] Cancel",
            Confirm::Quit => {
                "Unsaved changes or a running Python process\n\n[S] Save all & quit   [D] Discard & quit   [C / Esc] Cancel\nQuitting also stops the running Python process."
            }
            Confirm::Delete => {
                "Move this file to recoverable trash?\nUnsaved edits will be discarded.\n\n[Y] Move to trash   [C / Esc] Cancel"
            }
        };
        let rect = popup(area, 78, 8);
        frame.render_widget(Clear, rect);
        frame.render_widget(
            Paragraph::new(message)
                .block(panel(" Confirm ", p))
                .wrap(Wrap { trim: false }),
            rect,
        );
    }
}

fn markdown_preview(source: &str) -> Text<'static> {
    use pulldown_cmark::{Event as Md, Options, Parser, Tag, TagEnd};
    let mut lines = Vec::new();
    let mut spans = Vec::new();
    let mut bold = false;
    let mut italic = false;
    let mut heading = false;
    let mut code = false;
    for event in Parser::new_ext(
        source,
        Options::ENABLE_TABLES
            | Options::ENABLE_TASKLISTS
            | Options::ENABLE_STRIKETHROUGH
            | Options::ENABLE_FOOTNOTES,
    ) {
        match event {
            Md::Start(tag) => match tag {
                Tag::Heading { .. } => {
                    heading = true;
                }
                Tag::Strong => bold = true,
                Tag::Emphasis => italic = true,
                Tag::CodeBlock(_) => code = true,
                Tag::Item => spans.push(Span::raw(" • ")),
                Tag::BlockQuote(_) => spans.push(Span::raw(" │ ")),
                Tag::Link { dest_url, .. } => spans.push(Span::styled(
                    format!("[{dest_url}] "),
                    Style::default().fg(Color::Cyan),
                )),
                Tag::Image { dest_url, .. } => {
                    spans.push(Span::raw(format!("[image: {dest_url}] ")))
                }
                _ => {}
            },
            Md::End(tag) => match tag {
                TagEnd::Heading(_) => {
                    lines.push(Line::from(std::mem::take(&mut spans)));
                    lines.push(Line::default());
                    heading = false;
                }
                TagEnd::Strong => bold = false,
                TagEnd::Emphasis => italic = false,
                TagEnd::CodeBlock => {
                    code = false;
                    if !spans.is_empty() {
                        lines.push(Line::from(std::mem::take(&mut spans)));
                    }
                }
                TagEnd::Paragraph | TagEnd::Item | TagEnd::TableRow => {
                    lines.push(Line::from(std::mem::take(&mut spans)));
                }
                TagEnd::TableCell => spans.push(Span::raw(" │ ")),
                _ => {}
            },
            Md::Text(text) | Md::Code(text) | Md::Html(text) | Md::InlineHtml(text) => {
                let mut style = Style::default();
                if bold || heading {
                    style = style.bold();
                }
                if italic {
                    style = style.italic();
                }
                if heading {
                    style = style.fg(Color::Cyan);
                }
                if code {
                    style = style.fg(Color::Green);
                }
                for (i, part) in safe_text(&text).split('\n').enumerate() {
                    if i > 0 {
                        lines.push(Line::from(std::mem::take(&mut spans)));
                    }
                    spans.push(Span::styled(part.to_owned(), style));
                }
            }
            Md::SoftBreak => spans.push(Span::raw(" ")),
            Md::HardBreak => lines.push(Line::from(std::mem::take(&mut spans))),
            Md::Rule => lines.push(Line::raw("────────────────────────────────────────")),
            Md::TaskListMarker(checked) => {
                spans.push(Span::raw(if checked { "[x] " } else { "[ ] " }))
            }
            _ => {}
        }
    }
    if !spans.is_empty() {
        lines.push(Line::from(spans));
    }
    Text::from(lines)
}

struct TerminalGuard;
impl Drop for TerminalGuard {
    fn drop(&mut self) {
        let _ = terminal::disable_raw_mode();
        let _ = execute!(
            io::stdout(),
            DisableBracketedPaste,
            LeaveAlternateScreen,
            crossterm::cursor::Show
        );
    }
}
/// Entry point used by both full and console-only builds. No HTTP server is started.
pub async fn run(args: &[String]) -> std::result::Result<(), Box<dyn std::error::Error>> {
    if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("{LOGO}\n\nUsage: codora console [folder] [file ...]\n\n{HELP}");
        return Ok(());
    }
    if !io::stdin().is_terminal() || !io::stdout().is_terminal() {
        return Err("Console mode requires an interactive terminal (TTY). Use console --help for shortcuts.".into());
    }
    let mut paths = args.iter();
    let first = paths.next().map(PathBuf::from);
    let (root, initial) = match first {
        Some(path) if path.is_dir() => (path, paths.cloned().collect::<Vec<_>>()),
        Some(path) => {
            let absolute = std::path::absolute(&path)?;
            let parent = absolute.parent().ok_or("File has no parent")?.to_path_buf();
            let name = absolute
                .file_name()
                .ok_or("Invalid file name")?
                .to_string_lossy()
                .into_owned();
            (
                parent,
                std::iter::once(name).chain(paths.cloned()).collect(),
            )
        }
        None => (std::env::current_dir()?, vec![]),
    };
    let workspace = Workspace::open(root).map_err(|e| e.1)?;
    let mut app = App::new(workspace).map_err(|e| e.1)?;
    app.refresh_tree().map_err(|e| e.1)?;
    for path in initial {
        if app.workspace.resolve(&path).map_err(|e| e.1)?.exists() {
            app.open(&path, 0).map_err(|e| e.1)?;
        } else {
            app.new_tab(String::new());
            app.current_mut().map_err(|e| e.1)?.path = Some(path);
        }
    }
    if !app.workspace.drafts().map_err(|e| e.1)?.is_empty() {
        app.notice("Recovery drafts available · Ctrl+E → Recover draft");
    }
    terminal::enable_raw_mode()?;
    let _guard = TerminalGuard;
    execute!(io::stdout(), EnterAlternateScreen, EnableBracketedPaste)?;
    let mut terminal = Terminal::new(CrosstermBackend::new(io::stdout()))?;
    terminal.clear()?;
    let result: io::Result<()> = async {
        while !app.quit {
            terminal.draw(|f| draw(f, &mut app))?;
            if event::poll(Duration::from_millis(80))? {
                let result = match event::read()? {
                    Event::Key(key) if key.kind != KeyEventKind::Release => app.key(key).await,
                    Event::Paste(text) => {
                        if let Some(prompt) = app.prompt.as_mut() {
                            prompt.input.insert_str(text.replace(['\n', '\r'], ""));
                        } else if let Some(picker) = app.picker.as_mut() {
                            picker.query.insert_str(text.replace(['\n', '\r'], ""));
                            picker.selected = 0;
                        } else if app.confirm.is_none()
                            && app.reader.is_none()
                            && !app.tabs.is_empty()
                        {
                            let editor = &mut app.current_mut().unwrap().editor;
                            let selected = editor.selection_range().is_some_and(|(a, b)| a != b);
                            editor.insert_str(text.replace("\r\n", "\n"));
                            app.changed_group(if selected { 2 } else { 1 });
                        }
                        Ok(())
                    }
                    _ => Ok(()),
                };
                if let Err(e) = result {
                    app.fail(e);
                }
            }
            if !app.quit
                && let Err(e) = app.tick()
            {
                app.fail(e);
            }
        }
        Ok(())
    }
    .await;
    // Any terminal error still attempts recovery, then the guard restores terminal state.
    let recovery = if result.is_err() {
        app.persist_drafts()
    } else {
        Ok(())
    };
    drop(app); // drops Runner control channels; active Python processes are terminated.
    result?;
    recovery.map_err(|e| e.1)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use ratatui::backend::TestBackend;
    fn app() -> (tempfile::TempDir, App) {
        let dir = tempfile::tempdir().unwrap();
        let app = App::new(Workspace::open(dir.path()).unwrap()).unwrap();
        (dir, app)
    }
    fn ctrl(c: char) -> KeyEvent {
        KeyEvent::new(KeyCode::Char(c), KeyModifiers::CONTROL)
    }
    #[test]
    fn save_conflict_keeps_external_file_and_recoverable_editor_text() {
        let (dir, mut app) = app();
        std::fs::write(dir.path().join("a.md"), "original\n").unwrap();
        app.open("a.md", 0).unwrap();
        app.current_mut().unwrap().editor.insert_str("local ");
        app.changed();
        std::fs::write(dir.path().join("a.md"), "external\n").unwrap();
        assert_eq!(app.save(None).unwrap_err().0, 409);
        assert_eq!(
            std::fs::read_to_string(dir.path().join("a.md")).unwrap(),
            "external\n"
        );
        assert!(app.current().unwrap().dirty);
        assert_eq!(
            app.workspace.drafts().unwrap()[0].content,
            "local original\n"
        );
    }
    #[test]
    fn utf8_crlf_and_final_newline_roundtrip_with_undo_and_history() {
        let (dir, mut app) = app();
        let original = "Привет 🌍\r\nстрока\r\n";
        std::fs::write(dir.path().join("a.md"), original).unwrap();
        app.open("a.md", 0).unwrap();
        assert_eq!(app.current().unwrap().text(), original);
        app.current_mut().unwrap().editor.insert_str("Да ");
        app.changed();
        app.save(None).unwrap();
        assert_eq!(
            app.workspace
                .snapshot("a.md", &app.workspace.history("a.md").unwrap()[0].id)
                .unwrap(),
            original
        );
        assert_eq!(
            std::fs::read_to_string(dir.path().join("a.md")).unwrap(),
            "Да Привет 🌍\r\nстрока\r\n"
        );
        app.current_mut().unwrap().editor.undo();
        app.changed();
        assert!(app.current().unwrap().dirty);
        assert_eq!(app.current().unwrap().text(), original);
    }
    #[tokio::test]
    async fn closing_dirty_tabs_requires_explicit_choice_and_preserves_other_tabs() {
        let (_dir, mut app) = app();
        app.new_tab("keep".into());
        app.new_tab("discard".into());
        app.key(ctrl('w')).await.unwrap();
        assert!(app.confirm.is_some());
        assert_eq!(app.tabs.len(), 2);
        app.key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE))
            .await
            .unwrap();
        assert_eq!(app.tabs.len(), 2);
        app.key(ctrl('w')).await.unwrap();
        app.key(KeyEvent::new(KeyCode::Char('d'), KeyModifiers::NONE))
            .await
            .unwrap();
        assert_eq!(app.tabs.len(), 1);
        assert_eq!(app.current().unwrap().text(), "keep");
        app.key(ctrl('q')).await.unwrap();
        assert!(!app.quit);
        assert!(app.confirm.is_some());
        assert_eq!(app.workspace.drafts().unwrap()[0].content, "keep");
    }
    #[tokio::test]
    async fn save_as_cannot_overwrite_an_existing_file_or_escape_workspace() {
        let (dir, mut app) = app();
        std::fs::write(dir.path().join("existing.md"), "keep").unwrap();
        app.new_tab("new".into());
        assert_eq!(app.save(Some("existing.md".into())).unwrap_err().0, 409);
        assert!(app.save(Some("../outside.md".into())).is_err());
        assert_eq!(
            std::fs::read_to_string(dir.path().join("existing.md")).unwrap(),
            "keep"
        );
    }
    #[tokio::test]
    async fn replace_all_is_one_undoable_edit_and_literal_search_handles_unicode() {
        let (_dir, mut app) = app();
        app.new_tab("один [x] один [x]".into());
        app.submit(Prompt {
            title: String::new(),
            input: TextArea::new(vec!["два".into()]),
            kind: PromptKind::ReplaceWith("один".into()),
        })
        .await
        .unwrap();
        assert_eq!(app.current().unwrap().text(), "два [x] два [x]");
        app.key(ctrl('z')).await.unwrap();
        assert_eq!(app.current().unwrap().text(), "один [x] один [x]");
        app.submit(Prompt {
            title: String::new(),
            input: TextArea::new(vec!["[x]".into()]),
            kind: PromptKind::Find,
        })
        .await
        .unwrap();
        assert_eq!(app.current().unwrap().editor.cursor(), (0, 5));
    }
    #[test]
    fn recovered_draft_is_an_unsaved_copy_and_survives_until_saved() {
        let (dir, mut app) = app();
        std::fs::write(dir.path().join("a.md"), "disk").unwrap();
        let draft = Draft {
            id: "console-recovery".into(),
            path: Some("a.md".into()),
            content: "recovery".into(),
        };
        app.workspace.save_draft(&draft).unwrap();
        app.action(Action::Draft(draft.id, draft.path, draft.content))
            .unwrap();
        assert!(app.current().unwrap().dirty);
        assert!(app.current().unwrap().path.is_none());
        assert_eq!(
            std::fs::read_to_string(dir.path().join("a.md")).unwrap(),
            "disk"
        );
        assert_eq!(app.workspace.drafts().unwrap().len(), 1);
        app.save(Some("recovered.md".into())).unwrap();
        assert!(app.workspace.drafts().unwrap().is_empty());
    }
    #[tokio::test]
    async fn clipboard_is_shared_between_tabs_and_cancel_save_as_keeps_tab() {
        let (_dir, mut app) = app();
        app.new_tab("Привет".into());
        app.key(ctrl('a')).await.unwrap();
        app.key(ctrl('c')).await.unwrap();
        app.new_tab(String::new());
        app.key(ctrl('v')).await.unwrap();
        assert_eq!(app.current().unwrap().text(), "Привет");
        app.key(ctrl('w')).await.unwrap();
        app.key(KeyEvent::new(KeyCode::Char('s'), KeyModifiers::NONE))
            .await
            .unwrap();
        assert!(app.prompt.is_some());
        app.key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE))
            .await
            .unwrap();
        assert_eq!(app.tabs.len(), 2);
        assert!(app.save_then.is_none());
    }
    #[test]
    fn console_settings_preserve_desktop_preferences() {
        let (_dir, mut app) = app();
        crate::preferences::save(
            &app.workspace,
            &serde_json::json!({"theme":"matrix","fontSize":19}),
        )
        .unwrap();
        app.settings.theme = 2;
        app.settings_changed().unwrap();
        let prefs = crate::preferences::load(&app.workspace).unwrap();
        assert_eq!(prefs["theme"], "matrix");
        assert_eq!(prefs["fontSize"], 19);
        assert_eq!(prefs["console"]["theme"], 2);
    }
    #[test]
    fn file_tree_sorts_siblings_and_hides_collapsed_descendants() {
        let (dir, mut app) = app();
        std::fs::create_dir_all(dir.path().join("b/sub")).unwrap();
        for path in ["z.md", "a.md", "b/c.md", "b/sub/a.md"] {
            std::fs::write(dir.path().join(path), "").unwrap();
        }
        app.refresh_tree().unwrap();
        let paths: Vec<_> = app.visible_tree().iter().map(|e| e.path.as_str()).collect();
        assert_eq!(
            paths,
            vec!["b", "b/sub", "b/sub/a.md", "b/c.md", "a.md", "z.md"]
        );
        app.collapsed.insert("b".into());
        assert_eq!(app.visible_tree().len(), 3);
    }
    #[test]
    fn welcome_dialogs_and_small_terminal_render_without_panics() {
        let (_dir, mut app) = app();
        for (width, height) in [(100, 32), (40, 16), (12, 4)] {
            let mut terminal = Terminal::new(TestBackend::new(width, height)).unwrap();
            terminal.draw(|f| draw(f, &mut app)).unwrap();
            if width == 100 {
                let contents = terminal
                    .backend()
                    .buffer()
                    .content
                    .iter()
                    .map(|c| c.symbol())
                    .collect::<String>();
                assert!(contents.contains("Command palette"));
                assert!(contents.contains("////////////////"));
            }
            app.palette();
            terminal.draw(|f| draw(f, &mut app)).unwrap();
            app.picker = None;
            app.prompt("Save", PromptKind::SaveAs, "");
            terminal.draw(|f| draw(f, &mut app)).unwrap();
            app.prompt = None;
        }
    }
    #[test]
    fn preview_preserves_unsupported_source_and_sanitizes_terminal_controls() {
        let input = "# Heading\n\n- [x] task\n\n```mermaid\ngraph TD; A-->B;\n```\n\n$x$\n";
        let rendered = markdown_preview(input)
            .lines
            .iter()
            .flat_map(|l| l.spans.iter().map(|s| s.content.as_ref()))
            .collect::<String>();
        assert!(rendered.contains("Heading"));
        assert!(rendered.contains("[x]"));
        assert!(rendered.contains("graph TD"));
        assert!(rendered.contains("$x$"));
        assert_eq!(safe_text("hello\x1b[2J\x07world"), "hello[2Jworld");
    }
    #[tokio::test]
    async fn python_runs_through_shared_runner_and_exposes_output() {
        let (_dir, mut app) = app();
        app.new_tab("print('Привет')\n".into());
        app.save(Some("test.py".into())).unwrap();
        app.command(Command::Run).unwrap();
        for _ in 0..100 {
            tokio::time::sleep(Duration::from_millis(20)).await;
            app.tick().unwrap();
            if app.report.as_ref().unwrap().finished {
                break;
            }
        }
        let report = app.report.as_ref().unwrap();
        assert!(report.finished);
        assert_eq!(report.exit_code, Some(0));
        assert_eq!(report.stdout, "Привет\n");
    }
}
