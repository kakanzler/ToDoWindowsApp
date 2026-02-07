// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Todo
{
    id: u32,
    title: String,
    completed: bool,
    #[serde(default)]
    dueDate: Option<String>,
    #[serde(default)]
    workedAt: Option<String>,
    #[serde(default)]
    doneAt: Option<String>,
}

fn todos_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir error: {e}"))?;

    fs::create_dir_all(&dir).map_err(|e| format!("create_dir_all error: {e}"))?;
    Ok(dir.join("todos.json"))
}

#[tauri::command]
fn load_todos(app: AppHandle) -> Result<Vec<Todo>, String> {
    let path = todos_path(&app)?;
    if !path.exists(){
        return Ok(vec![]);
    }

    let s = fs::read_to_string(&path).map_err(|e| format!("read_to_string error: {e}"))?;
    let todos: Vec<Todo> = serde_json::from_str(&s).map_err(|e| format!("json parse error: {e}"))?;
    Ok(todos)
}

#[tauri::command]
fn save_todos(app: AppHandle, todos: Vec<Todo>) -> Result<(), String> {
    let path = todos_path(&app)?;
    let s = serde_json::to_string_pretty(&todos).map_err(|e| format!("json serialize error: {e}"))?;
    fs::write(&path, s).map_err(|e| format!("write error: {e}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![load_todos, save_todos])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
