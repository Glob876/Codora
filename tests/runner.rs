use codora::{
    core::Workspace,
    runner::{RunReport, Runner},
};
use std::{fs, time::Duration};
async fn finished(runner: &Runner, workspace: &Workspace, id: &str) -> RunReport {
    for _ in 0..200 {
        let report = runner.report(workspace, id).unwrap();
        if report.finished {
            return report;
        }
        tokio::time::sleep(Duration::from_millis(20)).await;
    }
    runner.send(workspace, id, None).unwrap();
    panic!("Python did not finish within the test deadline");
}
#[tokio::test]
async fn python_streams_output_accepts_input_and_uses_script_directory() {
    let root = tempfile::tempdir().unwrap();
    fs::create_dir(root.path().join("nested")).unwrap();
    fs::write(root.path().join("nested/data.txt"), "local data").unwrap();
    fs::write(root.path().join("nested/hello world.py"), "import sys\nprint(open('data.txt').read())\nprint('Ошибка', file=sys.stderr)\nprint('Hello ' + input())\n").unwrap();
    let workspace = Workspace::open(root.path()).unwrap();
    let runner = Runner::default();
    let path = "nested/hello world.py";
    let run = runner
        .start(&workspace, path, &workspace.read(path).unwrap().revision)
        .unwrap();
    for _ in 0..100 {
        if runner
            .report(&workspace, &run.id)
            .unwrap()
            .stdout
            .contains("local data")
        {
            break;
        }
        tokio::time::sleep(Duration::from_millis(20)).await;
    }
    assert!(!runner.report(&workspace, &run.id).unwrap().finished);
    runner
        .send(&workspace, &run.id, Some("Мир".into()))
        .unwrap();
    let report = finished(&runner, &workspace, &run.id).await;
    assert_eq!(report.exit_code, Some(0));
    assert!(report.stdout.contains("Hello Мир"));
    assert!(report.stderr.contains("Ошибка"));
}
#[tokio::test]
async fn python_reports_tracebacks_and_limits_output_without_blocking_exit() {
    let root = tempfile::tempdir().unwrap();
    fs::write(
        root.path().join("error.py"),
        "print('x' * 400000)\nraise RuntimeError('runner-test')\n",
    )
    .unwrap();
    let workspace = Workspace::open(root.path()).unwrap();
    let runner = Runner::default();
    let run = runner
        .start(
            &workspace,
            "error.py",
            &workspace.read("error.py").unwrap().revision,
        )
        .unwrap();
    let report = finished(&runner, &workspace, &run.id).await;
    assert_eq!(report.exit_code, Some(1));
    assert!(report.truncated);
    assert!(report.stdout.len() + report.stderr.len() <= 256 * 1024);
    fs::write(
        root.path().join("error.py"),
        "raise RuntimeError('runner-test')",
    )
    .unwrap();
    let run = runner
        .start(
            &workspace,
            "error.py",
            &workspace.read("error.py").unwrap().revision,
        )
        .unwrap();
    let report = finished(&runner, &workspace, &run.id).await;
    assert!(report.stderr.contains("RuntimeError: runner-test"));
}
#[tokio::test]
async fn python_requires_valid_workspace_script_and_current_revision() {
    let root = tempfile::tempdir().unwrap();
    fs::write(root.path().join("test.py"), "print(1)").unwrap();
    fs::write(root.path().join("test.txt"), "print(1)").unwrap();
    let workspace = Workspace::open(root.path()).unwrap();
    let runner = Runner::default();
    assert_eq!(
        runner.start(&workspace, "test.py", "stale").unwrap_err().0,
        409
    );
    assert!(runner.start(&workspace, "../outside.py", "x").is_err());
    assert!(runner.start(&workspace, "test.txt", "x").is_err());
    fs::write(
        root.path().join("test.py"),
        "import time\nprint('ready')\ntime.sleep(60)",
    )
    .unwrap();
    let run = runner
        .start(
            &workspace,
            "test.py",
            &workspace.read("test.py").unwrap().revision,
        )
        .unwrap();
    assert!(runner.is_running().unwrap());
    assert_eq!(runner.start(&workspace, "test.py", "x").unwrap_err().0, 409);
    let other = tempfile::tempdir().unwrap();
    assert!(
        runner
            .report(&Workspace::open(other.path()).unwrap(), &run.id)
            .is_err()
    );
    runner.send(&workspace, &run.id, None).unwrap();
    assert!(finished(&runner, &workspace, &run.id).await.stopped);
    assert!(!runner.is_running().unwrap());
}
#[cfg(target_os = "linux")]
#[tokio::test]
async fn stopping_python_terminates_its_process_group() {
    let root = tempfile::tempdir().unwrap();
    fs::write(root.path().join("children.py"), "import subprocess, sys, time\np = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)'])\nprint(p.pid)\ntime.sleep(60)\n").unwrap();
    let workspace = Workspace::open(root.path()).unwrap();
    let runner = Runner::default();
    let run = runner
        .start(
            &workspace,
            "children.py",
            &workspace.read("children.py").unwrap().revision,
        )
        .unwrap();
    let mut descendant = None;
    for _ in 0..100 {
        descendant = runner
            .report(&workspace, &run.id)
            .unwrap()
            .stdout
            .trim()
            .parse::<u32>()
            .ok();
        if descendant.is_some() {
            break;
        }
        tokio::time::sleep(Duration::from_millis(20)).await;
    }
    let pid = descendant.expect("Python should start its child");
    runner.send(&workspace, &run.id, None).unwrap();
    assert!(finished(&runner, &workspace, &run.id).await.stopped);
    for _ in 0..100 {
        match fs::read_to_string(format!("/proc/{pid}/stat")) {
            Err(_) => return,
            Ok(stat)
                if stat
                    .split_once(") ")
                    .is_some_and(|(_, state)| state.starts_with('Z')) =>
            {
                return;
            }
            _ => tokio::time::sleep(Duration::from_millis(20)).await,
        }
    }
    panic!("Python descendant survived Stop");
}
