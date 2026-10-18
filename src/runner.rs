//! Explicit local Python execution. Commands never pass through a shell.
use crate::core::{Error, Result, Workspace, bad};
use serde::Serialize;
use std::{
    path::PathBuf,
    process::Stdio,
    sync::{Arc, Mutex},
};
use tokio::{
    io::{AsyncRead, AsyncReadExt, AsyncWriteExt},
    process::Command,
    sync::mpsc,
};

const OUTPUT_LIMIT: usize = 256 * 1024;
#[derive(Clone, Debug, Serialize)]
pub struct RunReport {
    pub id: String,
    pub path: String,
    pub stdout: String,
    pub stderr: String,
    pub finished: bool,
    pub exit_code: Option<i32>,
    pub stopped: bool,
    pub truncated: bool,
}
#[derive(Default)]
struct Output {
    stdout: Vec<u8>,
    stderr: Vec<u8>,
    finished: bool,
    exit_code: Option<i32>,
    stopped: bool,
    truncated: bool,
}
struct Job {
    id: String,
    path: String,
    root: PathBuf,
    output: Arc<Mutex<Output>>,
    control: mpsc::Sender<Control>,
}
enum Control {
    Stop,
    Input(String),
}
#[derive(Default)]
pub struct Runner {
    job: Mutex<Option<Job>>,
}
fn poisoned() -> Error {
    Error(500, "Не удалось получить состояние запуска".into())
}
impl Job {
    fn report(&self) -> Result<RunReport> {
        let output = self.output.lock().map_err(|_| poisoned())?;
        Ok(RunReport {
            id: self.id.clone(),
            path: self.path.clone(),
            stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
            finished: output.finished,
            exit_code: output.exit_code,
            stopped: output.stopped,
            truncated: output.truncated,
        })
    }
}
impl Runner {
    pub fn is_running(&self) -> Result<bool> {
        let job = self.job.lock().map_err(|_| poisoned())?;
        Ok(job
            .as_ref()
            .map(Job::report)
            .transpose()?
            .is_some_and(|report| !report.finished))
    }
    pub fn start(
        &self,
        workspace: &Workspace,
        path: &str,
        expected_revision: &str,
    ) -> Result<RunReport> {
        let mut slot = self.job.lock().map_err(|_| poisoned())?;
        if slot
            .as_ref()
            .map(Job::report)
            .transpose()?
            .is_some_and(|report| !report.finished)
        {
            return Err(Error(409, "Сначала остановите выполняющийся скрипт".into()));
        }
        if !path.to_ascii_lowercase().ends_with(".py") {
            return Err(bad("Запуск поддерживается для файлов .py"));
        }
        let full = workspace.resolve(path)?;
        if workspace.read(path)?.revision != expected_revision {
            return Err(Error(
                409,
                "Скрипт изменён на диске. Перечитайте его перед запуском".into(),
            ));
        }
        let parent = full.parent().ok_or_else(|| bad("У файла нет папки"))?;
        // Prefer a workspace virtual environment without installing packages or downloading Python.
        let venv = if cfg!(windows) {
            ".venv/Scripts/python.exe"
        } else {
            ".venv/bin/python"
        };
        let local_python = workspace.root.join(venv);
        let mut candidates = Vec::new();
        if local_python.is_file() {
            candidates.push((local_python.into_os_string(), false));
        }
        if cfg!(windows) {
            candidates.push(("py".into(), true));
            candidates.push(("python".into(), false));
        } else {
            candidates.push(("python3".into(), false));
            candidates.push(("python".into(), false));
        }
        let mut spawned = None;
        for (interpreter, launcher) in candidates {
            let mut command = Command::new(interpreter);
            if launcher {
                command.arg("-3");
            }
            command
                .arg("-u")
                .arg(&full)
                .current_dir(parent)
                .env("PYTHONIOENCODING", "utf-8")
                .env("PYTHONUTF8", "1")
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .kill_on_drop(true);
            #[cfg(unix)]
            command.process_group(0);
            match command.spawn() {
                Ok(child) => {
                    spawned = Some(child);
                    break;
                }
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
                Err(error) => {
                    return Err(Error(500, format!("Не удалось запустить Python: {error}")));
                }
            }
        }
        let mut child = spawned.ok_or_else(|| {
            bad("Python не найден. Установите Python 3 или создайте .venv в рабочей папке")
        })?;
        let mut group = ProcessGroup(child.id());
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| bad("Нет stdout Python"))?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| bad("Нет stderr Python"))?;
        let mut stdin = child.stdin.take().ok_or_else(|| bad("Нет stdin Python"))?;
        let output = Arc::new(Mutex::new(Output::default()));
        let (control, mut commands) = mpsc::channel(16);
        let job = Job {
            id: uuid::Uuid::new_v4().to_string(),
            path: path.into(),
            root: workspace.root.clone(),
            output: output.clone(),
            control,
        };
        let report = job.report()?;
        *slot = Some(job);
        tokio::spawn(async move {
            let mut out_reader = tokio::spawn(read_output(stdout, output.clone(), false));
            let mut err_reader = tokio::spawn(read_output(stderr, output.clone(), true));
            let (input_sender, mut input_receiver) = mpsc::channel::<String>(16);
            let input_output = output.clone();
            let input_writer = tokio::spawn(async move {
                while let Some(text) = input_receiver.recv().await {
                    if let Err(error) = stdin.write_all(text.as_bytes()).await {
                        append(
                            &input_output,
                            true,
                            format!("\nОшибка stdin: {error}\n").as_bytes(),
                        );
                        break;
                    }
                }
            });
            let status = loop {
                tokio::select! {
                    status = child.wait() => break status,
                    command = commands.recv() => match command {
                        Some(Control::Input(text)) => {
                            if input_sender.try_send(text).is_err() { append(&output, true, "\nОчередь ввода заполнена или stdin закрыт\n".as_bytes()); }
                        },
                        Some(Control::Stop) | None => {
                            if let Ok(mut state) = output.lock() { state.stopped = true; }
                            group.kill();
                            let _ = child.start_kill();
                            break child.wait().await;
                        }
                    }
                }
            };
            // A background descendant must not keep the output pipe/process alive after completion.
            group.kill();
            input_writer.abort();
            if tokio::time::timeout(std::time::Duration::from_secs(2), async {
                let _ = (&mut out_reader).await;
                let _ = (&mut err_reader).await;
            })
            .await
            .is_err()
            {
                out_reader.abort();
                err_reader.abort();
                append(
                    &output,
                    true,
                    "\nЧтение вывода остановлено: поток остался открытым\n".as_bytes(),
                );
            }
            if let Ok(mut state) = output.lock() {
                match status {
                    Ok(status) => state.exit_code = status.code(),
                    Err(error) => state
                        .stderr
                        .extend_from_slice(format!("\nОшибка процесса: {error}").as_bytes()),
                }
                state.finished = true;
            }
        });
        Ok(report)
    }
    pub fn report(&self, workspace: &Workspace, id: &str) -> Result<RunReport> {
        let slot = self.job.lock().map_err(|_| poisoned())?;
        let job = slot
            .as_ref()
            .filter(|job| job.id == id && job.root == workspace.root)
            .ok_or_else(|| Error(404, "Запуск не найден в этой рабочей папке".into()))?;
        job.report()
    }
    pub fn send(&self, workspace: &Workspace, id: &str, input: Option<String>) -> Result<()> {
        let slot = self.job.lock().map_err(|_| poisoned())?;
        let job = slot
            .as_ref()
            .filter(|job| job.id == id && job.root == workspace.root)
            .ok_or_else(|| Error(404, "Запуск не найден".into()))?;
        if job.report()?.finished {
            return Ok(());
        }
        let command = if let Some(text) = input {
            if text.len() > 8192 {
                return Err(bad("Строка ввода больше 8 КБ"));
            }
            Control::Input(text + "\n")
        } else {
            Control::Stop
        };
        job.control
            .try_send(command)
            .map_err(|_| bad("Процесс не принимает команды; повторите попытку"))
    }
}
fn append(output: &Mutex<Output>, error_stream: bool, bytes: &[u8]) {
    if let Ok(mut state) = output.lock() {
        let remaining = OUTPUT_LIMIT.saturating_sub(state.stdout.len() + state.stderr.len());
        if bytes.len() > remaining {
            state.truncated = true;
        }
        let buffer = if error_stream {
            &mut state.stderr
        } else {
            &mut state.stdout
        };
        buffer.extend_from_slice(&bytes[..bytes.len().min(remaining)]);
    }
}
async fn read_output(
    mut reader: impl AsyncRead + Unpin,
    output: Arc<Mutex<Output>>,
    error_stream: bool,
) {
    let mut bytes = [0u8; 4096];
    loop {
        match reader.read(&mut bytes).await {
            Ok(0) => break,
            Ok(count) => append(&output, error_stream, &bytes[..count]),
            Err(error) => {
                append(
                    &output,
                    true,
                    format!("\nОшибка вывода: {error}\n").as_bytes(),
                );
                break;
            }
        }
    }
}
struct ProcessGroup(Option<u32>);
impl ProcessGroup {
    fn kill(&mut self) {
        #[cfg(not(unix))]
        {
            let _ = self.0.take();
        }
        #[cfg(unix)]
        if let Some(pid) = self.0.take().filter(|pid| *pid > 0) {
            // SAFETY: the child starts a new group whose ID is its positive PID.
            unsafe {
                libc::kill(-(pid as i32), libc::SIGKILL);
            }
        }
    }
}
impl Drop for ProcessGroup {
    fn drop(&mut self) {
        self.kill();
    }
}
