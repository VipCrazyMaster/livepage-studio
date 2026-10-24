use base64::Engine as _;
use serde::Serialize;
use std::fs;
use tauri::Manager;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
pub struct PickedImage {
    name: String,
    #[serde(rename = "dataUrl")]
    data_url: String,
}

#[derive(Serialize)]
pub struct OpenedFile {
    path: String,
    contents: String,
}

fn write_atomic(path: &Path, contents: &str) -> std::io::Result<()> {
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    let tmp: PathBuf = parent.join(format!(
        ".{}.tmp",
        path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("livepage")
    ));
    fs::write(&tmp, contents.as_bytes())?;
    fs::rename(&tmp, path)?;
    Ok(())
}

#[tauri::command]
fn open_html() -> Option<OpenedFile> {
    let picked = rfd::FileDialog::new()
        .add_filter("HTML", &["html", "htm"])
        .pick_file()?;
    let contents = fs::read_to_string(&picked).ok()?;
    Some(OpenedFile {
        path: picked.to_string_lossy().to_string(),
        contents,
    })
}

#[tauri::command]
fn pick_image() -> Option<PickedImage> {
    let path = rfd::FileDialog::new()
        .add_filter("Image", &["png", "jpg", "jpeg", "webp", "gif", "bmp"])
        .pick_file()?;
    let bytes = fs::read(&path).ok()?;
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .unwrap_or_default();
    let mime = match ext.as_str() {
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        _ => "image/jpeg",
    };
    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Some(PickedImage {
        name: path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("image")
            .to_string(),
        data_url: format!("data:{};base64,{}", mime, encoded),
    })
}

#[tauri::command]
fn save_html(path: Option<String>, contents: String, suggested_name: String) -> Option<String> {
    let target = match path {
        Some(existing) if !existing.is_empty() => PathBuf::from(existing),
        _ => {
            let default_name = if suggested_name.is_empty() {
                "edited.html".to_string()
            } else {
                suggested_name
            };
            rfd::FileDialog::new()
                .add_filter("HTML", &["html", "htm"])
                .set_file_name(default_name)
                .save_file()?
        }
    };
    write_atomic(&target, &contents).ok()?;
    Some(target.to_string_lossy().to_string())
}

pub fn selftest(target: &str) -> bool {
    let path = PathBuf::from(target);
    let payload = "<!doctype html><html><body>livepage selftest</body></html>";
    match write_atomic(&path, payload) {
        Ok(()) => fs::read_to_string(&path)
            .map(|text| text == payload)
            .unwrap_or(false),
        Err(_) => false,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![open_html, save_html, pick_image])
        .build(tauri::generate_context!())
        .expect("error while building Livepage Studio");

    app.run(|handle, event| {
        #[cfg(target_os = "macos")]
        {
            if let tauri::RunEvent::Reopen { .. } = event {
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
        #[cfg(not(target_os = "macos"))]
        let _ = (handle, event);
    });
}
