use regex::RegexBuilder;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::Write,
    path::{Component, Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
use uuid::Uuid;
use walkdir::WalkDir;

pub const MAX_DOCUMENT: u64 = 16 * 1024 * 1024;
pub type Result<T> = std::result::Result<T, Error>;
#[derive(Debug)]
pub struct Error(pub u16, pub String);
impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        Self(500, e.to_string())
    }
}
impl From<serde_json::Error> for Error {
    fn from(e: serde_json::Error) -> Self {
        Self(500, e.to_string())
    }
}
pub fn bad(message: &str) -> Error {
    Error(400, message.into())
}
pub fn revision(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}
fn stamp() -> String {
    format!(
        "{}-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis(),
        Uuid::new_v4()
    )
}
pub fn atomic_write(path: &Path, content: &[u8]) -> Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| bad("У файла нет родительской папки"))?;
    let tmp = parent.join(format!(".typoha-{}.tmp", Uuid::new_v4()));
    let result = (|| -> Result<()> {
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&tmp)?;
        // Preserve user permissions when replacing an existing file.
        if let Ok(meta) = fs::metadata(path) {
            file.set_permissions(meta.permissions())?;
        }
        file.write_all(content)?;
        file.sync_all()?;
        fs::rename(&tmp, path)?;
        #[cfg(unix)]
        fs::File::open(parent)?.sync_all()?;
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(tmp);
    }
    result
}
#[derive(Clone, Debug)]
pub struct Workspace {
    pub root: PathBuf,
}
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Entry {
    pub path: String,
    pub name: String,
    pub directory: bool,
    pub modified: u64,
    pub bytes: u64,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct Document {
    pub path: String,
    pub content: String,
    pub revision: String,
}
#[derive(Deserialize, Serialize)]
pub struct Save {
    pub path: String,
    pub content: String,
    pub expected_revision: Option<String>,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct Snapshot {
    pub id: String,
    pub bytes: u64,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct TrashEntry {
    pub id: String,
    pub path: String,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct SearchHit {
    pub path: String,
    pub line: usize,
    pub text: String,
}
#[derive(Deserialize)]
pub struct Search {
    pub query: String,
    #[serde(default)]
    pub regex: bool,
    #[serde(default)]
    pub case_sensitive: bool,
    #[serde(default)]
    pub whole_word: bool,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct Draft {
    pub id: String,
    pub path: Option<String>,
    pub content: String,
}
impl Workspace {
    pub fn open(root: impl AsRef<Path>) -> Result<Self> {
        let root = root.as_ref().canonicalize()?;
        if !root.is_dir() {
            return Err(bad("Выберите папку"));
        }
        let workspace = Self { root };
        // Never follow an attacker-created metadata-directory symlink.
        workspace.internal("history")?;
        workspace.internal("drafts")?;
        workspace.internal("trash")?;
        Ok(workspace)
    }
    fn relative(path: &str) -> Result<&Path> {
        let p = Path::new(path);
        if path.is_empty()
            || p.components().any(|c| !matches!(c, Component::Normal(_)))
            || p.components().any(|c| c.as_os_str() == ".typoha")
        {
            return Err(bad("Недопустимый относительный путь"));
        }
        Ok(p)
    }
    pub fn resolve(&self, path: &str) -> Result<PathBuf> {
        let relative = Self::relative(path)?;
        let full = self.root.join(relative);
        let mut ancestor = full.as_path();
        while !ancestor.exists() {
            ancestor = ancestor
                .parent()
                .ok_or_else(|| bad("Путь вне рабочей папки"))?;
        }
        let resolved = ancestor.canonicalize()?;
        if !resolved.starts_with(&self.root) {
            return Err(Error(403, "Ссылка ведёт за пределы рабочей папки".into()));
        }
        // Reject all symlinks in user file paths, including dangling symlinks.
        let mut cursor = self.root.clone();
        for part in relative.components() {
            cursor.push(part);
            if fs::symlink_metadata(&cursor).is_ok_and(|m| m.file_type().is_symlink()) {
                return Err(Error(403, "Символические ссылки не поддерживаются".into()));
            }
        }
        Ok(full)
    }
    pub fn internal(&self, sub: &str) -> Result<PathBuf> {
        Self::relative(sub)?;
        let mut current = self.root.join(".typoha");
        Self::reject_symlink(&current)?;
        fs::create_dir_all(&current)?;
        for component in Path::new(sub).components() {
            current.push(component);
            Self::reject_symlink(&current)?;
            fs::create_dir_all(&current)?;
        }
        Ok(current)
    }
    fn reject_symlink(path: &Path) -> Result<()> {
        if fs::symlink_metadata(path).is_ok_and(|m| m.file_type().is_symlink()) {
            return Err(Error(
                403,
                "Служебные данные не могут быть символической ссылкой".into(),
            ));
        }
        Ok(())
    }
    pub fn metadata_file(&self, sub: &str, file: &str) -> Result<PathBuf> {
        Self::relative(file)?;
        if Path::new(file).components().count() != 1 {
            return Err(bad("Недопустимое имя служебного файла"));
        }
        let path = self.internal(sub)?.join(file);
        Self::reject_symlink(&path)?;
        Ok(path)
    }
    pub fn list(&self, hidden: bool, all: bool) -> Result<Vec<Entry>> {
        let mut entries = Vec::new();
        let iter = WalkDir::new(&self.root)
            .follow_links(false)
            .max_depth(16)
            .into_iter()
            .filter_entry(|e| {
                let name = e.file_name().to_string_lossy();
                e.depth() == 0
                    || (name != ".typoha"
                        && name != ".git"
                        && name != "node_modules"
                        && (hidden || !name.starts_with('.')))
            });
        for e in iter {
            let e = e.map_err(|e| Error(500, e.to_string()))?;
            if e.depth() == 0 || e.file_type().is_symlink() {
                continue;
            }
            let dir = e.file_type().is_dir();
            if !dir && !all && !is_markdown(e.path()) {
                continue;
            }
            let m = e.metadata().map_err(|e| Error(500, e.to_string()))?;
            entries.push(Entry {
                path: e
                    .path()
                    .strip_prefix(&self.root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/"),
                name: e.file_name().to_string_lossy().into(),
                directory: dir,
                modified: m
                    .modified()
                    .unwrap_or(UNIX_EPOCH)
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
                bytes: m.len(),
            });
            if entries.len() > 20_000 {
                return Err(bad("Слишком много файлов: откройте более узкую папку"));
            }
        }
        entries.sort_by(|a, b| {
            b.directory
                .cmp(&a.directory)
                .then(a.path.to_lowercase().cmp(&b.path.to_lowercase()))
        });
        Ok(entries)
    }
    pub fn read(&self, path: &str) -> Result<Document> {
        let full = self.resolve(path)?;
        if fs::metadata(&full)?.len() > MAX_DOCUMENT {
            return Err(bad("Документ больше 16 МБ"));
        }
        let bytes = fs::read(full)?;
        let rev = revision(&bytes);
        let content =
            String::from_utf8(bytes).map_err(|_| bad("Поддерживаются текстовые файлы UTF-8"))?;
        Ok(Document {
            path: path.into(),
            content,
            revision: rev,
        })
    }
    pub fn save(&self, save: Save) -> Result<Document> {
        if save.content.len() as u64 > MAX_DOCUMENT {
            return Err(bad("Документ больше 16 МБ"));
        }
        let path = self.resolve(&save.path)?;
        if path.exists() {
            let previous = fs::read(&path)?;
            if save.expected_revision.as_deref() != Some(&revision(&previous)) {
                return Err(Error(409, "Файл изменён на диске. Сохраните копию или перечитайте его; ваши правки сохранены в черновике.".into()));
            }
            if previous != save.content.as_bytes() {
                let dir = self.internal(&format!("history/{}", revision(save.path.as_bytes())))?;
                fs::create_dir_all(&dir)?;
                atomic_write(&dir.join(format!("{}.md", stamp())), &previous)?;
            }
        } else if save.expected_revision.is_some() {
            return Err(Error(
                409,
                "Файл удалён или перемещён. Сохраните правки под новым именем.".into(),
            ));
        }
        if !path.parent().is_some_and(Path::is_dir) {
            return Err(bad("Родительская папка не существует"));
        }
        atomic_write(&path, save.content.as_bytes())?;
        self.read(&save.path)
    }
    pub fn mkdir(&self, path: &str) -> Result<()> {
        fs::create_dir(self.resolve(path)?)?;
        Ok(())
    }
    pub fn rename(&self, from: &str, to: &str) -> Result<()> {
        let a = self.resolve(from)?;
        let b = self.resolve(to)?;
        if b.exists() {
            return Err(Error(409, "Такой путь уже существует".into()));
        }
        fs::rename(a, b)?;
        Ok(())
    }
    pub fn trash(&self, path: &str) -> Result<String> {
        let from = self.resolve(path)?;
        let id = stamp();
        let dir = self.internal("trash")?.join(&id);
        fs::create_dir(&dir)?;
        atomic_write(
            &dir.join("meta.json"),
            &serde_json::to_vec(&TrashEntry {
                id: id.clone(),
                path: path.into(),
            })?,
        )?;
        fs::rename(from, dir.join("payload"))?;
        Ok(id)
    }
    pub fn trash_list(&self) -> Result<Vec<TrashEntry>> {
        let mut entries: Vec<TrashEntry> = Vec::new();
        for e in fs::read_dir(self.internal("trash")?)? {
            let dir = e?.path();
            Self::reject_symlink(&dir)?;
            if dir.join("payload").exists() {
                entries.push(serde_json::from_slice(&fs::read(self.metadata_file(
                    &format!("trash/{}", dir.file_name().unwrap().to_string_lossy()),
                    "meta.json",
                )?)?)?);
            }
        }
        entries.sort_by(|a, b| b.id.cmp(&a.id));
        Ok(entries)
    }
    pub fn restore(&self, id: &str) -> Result<String> {
        valid_id(id)?;
        let dir = self.internal(&format!("trash/{id}"))?;
        let entry: TrashEntry = serde_json::from_slice(&fs::read(self.metadata_file(
            &format!("trash/{}", dir.file_name().unwrap().to_string_lossy()),
            "meta.json",
        )?)?)?;
        let to = self.resolve(&entry.path)?;
        if to.exists() {
            return Err(Error(
                409,
                "Восстановление заменило бы существующий файл".into(),
            ));
        }
        Self::reject_symlink(&dir.join("payload"))?;
        fs::rename(dir.join("payload"), to)?;
        Ok(entry.path)
    }
    pub fn history(&self, path: &str) -> Result<Vec<Snapshot>> {
        self.resolve(path)?;
        let dir = self.internal(&format!("history/{}", revision(path.as_bytes())))?;
        if !dir.exists() {
            return Ok(Vec::new());
        }
        let mut snapshots = Vec::new();
        for e in fs::read_dir(dir)? {
            let e = e?;
            Self::reject_symlink(&e.path())?;
            snapshots.push(Snapshot {
                id: e.file_name().to_string_lossy().into(),
                bytes: e.metadata()?.len(),
            });
        }
        snapshots.sort_by(|a, b| b.id.cmp(&a.id));
        Ok(snapshots)
    }
    pub fn snapshot(&self, path: &str, id: &str) -> Result<String> {
        self.resolve(path)?;
        valid_id(id)?;
        Ok(fs::read_to_string(self.metadata_file(
            &format!("history/{}", revision(path.as_bytes())),
            id,
        )?)?)
    }
    pub fn save_draft(&self, draft: &Draft) -> Result<()> {
        valid_id(&draft.id)?;
        if draft.content.len() as u64 > MAX_DOCUMENT {
            return Err(bad("Черновик больше 16 МБ"));
        }
        atomic_write(
            &self.metadata_file("drafts", &format!("{}.json", draft.id))?,
            &serde_json::to_vec(draft)?,
        )
    }
    pub fn drafts(&self) -> Result<Vec<Draft>> {
        let mut result = Vec::new();
        for e in fs::read_dir(self.internal("drafts")?)? {
            let entry = e?;
            Self::reject_symlink(&entry.path())?;
            if let Ok(d) = serde_json::from_slice::<Draft>(&fs::read(entry.path())?) {
                result.push(d);
            }
        }
        Ok(result)
    }
    pub fn clear_draft(&self, id: &str) -> Result<()> {
        valid_id(id)?;
        match fs::remove_file(self.metadata_file("drafts", &format!("{id}.json"))?) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e.into()),
        }
    }
    pub fn search(&self, query: &Search) -> Result<Vec<SearchHit>> {
        if query.query.is_empty() {
            return Ok(Vec::new());
        }
        if query.query.len() > 4096 {
            return Err(bad("Слишком длинный поисковый запрос"));
        }
        let mut expression = if query.regex {
            query.query.clone()
        } else {
            regex::escape(&query.query)
        };
        if query.whole_word {
            expression = format!(r"\b(?:{expression})\b");
        }
        let re = RegexBuilder::new(&expression)
            .case_insensitive(!query.case_sensitive)
            .size_limit(2_000_000)
            .build()
            .map_err(|e| bad(&format!("Неверное регулярное выражение: {e}")))?;
        let mut hits = Vec::new();
        for e in self.list(false, false)? {
            if e.directory || e.bytes > 2_000_000 {
                continue;
            }
            let Ok(doc) = self.read(&e.path) else {
                continue;
            };
            for (n, line) in doc.content.lines().enumerate() {
                if re.is_match(line) {
                    hits.push(SearchHit {
                        path: e.path.clone(),
                        line: n + 1,
                        text: line.chars().take(280).collect(),
                    });
                }
                if hits.len() >= 500 {
                    return Ok(hits);
                }
            }
        }
        Ok(hits)
    }
    pub fn upload(&self, filename: &str, bytes: &[u8]) -> Result<String> {
        let ext = Path::new(filename)
            .extension()
            .and_then(|x| x.to_str())
            .unwrap_or("")
            .to_lowercase();
        if !["png", "jpg", "jpeg", "gif", "webp", "avif"].contains(&ext.as_str()) {
            return Err(bad("Разрешены PNG, JPEG, GIF, WebP и AVIF"));
        }
        if bytes.len() > 20 * 1024 * 1024 {
            return Err(bad("Изображение больше 20 МБ"));
        }
        let dir = self.resolve("assets")?;
        fs::create_dir_all(&dir)?;
        let path = format!("assets/{}.{}", Uuid::new_v4(), ext);
        atomic_write(&self.resolve(&path)?, bytes)?;
        Ok(path)
    }
}
pub fn valid_id(id: &str) -> Result<()> {
    if id.is_empty()
        || !id
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'.')
        || id.contains("..")
    {
        return Err(bad("Недопустимый идентификатор"));
    }
    Ok(())
}
pub fn is_markdown(path: &Path) -> bool {
    path.extension().and_then(|s| s.to_str()).is_some_and(|s| {
        ["md", "markdown", "mdown", "mkd", "txt"].contains(&s.to_lowercase().as_str())
    })
}
