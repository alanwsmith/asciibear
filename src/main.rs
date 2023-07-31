use axum::extract::ws::Message;
use axum::extract::ws::WebSocket;
use axum::extract::ws::WebSocketUpgrade;
use axum::extract::State;
use axum::response::Html;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use device_query::{DeviceEvents, DeviceState};
use futures::sink::SinkExt;
use futures::stream::StreamExt;
use std::collections::HashSet;
use std::net::SocketAddr;
use std::sync::Arc;
use std::sync::Mutex;
use tokio::sync::broadcast;
//use tracing_subscriber::layer::SubscriberExt;
// use tracing_subscriber::util::SubscriberInitExt;
use uuid::Uuid;

struct AppState {
    user_set: Mutex<HashSet<String>>,
    tx: broadcast::Sender<String>,
}

#[tokio::main]
async fn main() {
    // tracing_subscriber::registry()
    //     .with(
    //         tracing_subscriber::EnvFilter::try_from_default_env()
    //             .unwrap_or_else(|_| "example_chat=trace".into()),
    //     )
    //     .with(tracing_subscriber::fmt::layer())
    //     .init();

    let user_set = Mutex::new(HashSet::new());
    let (tx, _rx) = broadcast::channel(100);
    let _handle = tokio::spawn(alfa(tx.clone()));
    let _keywatcher_handle = tokio::spawn(keywatcher(tx.clone()));
    let app_state = Arc::new(AppState { user_set, tx });

    let app = Router::new()
        .route("/", get(index))
        .route("/xstate.js", get(xstate))
        .route("/ws", get(websocket_handler))
        // .route("/wskeys", get(websocket_keys_handler))
        .with_state(app_state);
    let addr = SocketAddr::from(([127, 0, 0, 1], 5757));
    //tracing::debug!("listening on {}", addr);
    let _ = axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await;
}

async fn keywatcher(tx: tokio::sync::broadcast::Sender<String>) {
    let device_state = DeviceState::new();
    let _guard = device_state.on_key_down(move |_| {
        let payload = r#"{"type": "key", "value": "HIDDEN_FOR_SECURITY"}"#.to_string();
        let _ = tx.clone().send(payload);
    });

    // sleep this for a year so the mic input keeps
    // coming thru. TODO: Find a more precice way
    // to do this which I'm guessing exists
    std::thread::sleep(std::time::Duration::from_secs(32536000));
}

async fn alfa(tx: tokio::sync::broadcast::Sender<String>) {
    dbg!("mic connection");

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .expect("no input device available");
    let config: cpal::StreamConfig = device.default_input_config().unwrap().into();
    let input_sender = move |data: &[f32], _cb: &cpal::InputCallbackInfo| {
        let x: f32 = data[0];
        let mut payload = r#"{"type": "dB", "value": "#.to_string();
        payload.push_str(x.to_string().as_str());
        payload.push_str(r#"}"#);
        let _ = tx.send(payload);
    };
    let input_stream = device
        .build_input_stream(&config, input_sender, err_fn, None)
        .unwrap();
    let _ = input_stream.play();

    // sleep this for a year so the mic input keeps
    // coming thru. TODO: Find a more precice way
    // to do this which I'm guessing exists
    std::thread::sleep(std::time::Duration::from_secs(32536000));

    //
}

async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| websocket(socket, state))
}

async fn websocket_keys_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| websocket_keys(socket, state))
}

async fn websocket_keys(stream: WebSocket, state: Arc<AppState>) {
    dbg!("keys connection");
    let (mut sender, mut receiver) = stream.split();

    let mut rx = state.tx.subscribe();
    let tx = state.tx.clone();
    dbg!(&rx);

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            dbg!(&text);
            let _ = tx.send(format!("{}", text));
        }
    });

    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            // In any websocket error, break loop.
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });
    // let mut recv_task = tokio::spawn(async move {
    //     while let Some(Ok(Message::Text(text))) = receiver.next().await {
    //         let _ = tx.send(format!("{}", text));
    //     }
    // });
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}

async fn websocket(stream: WebSocket, state: Arc<AppState>) {
    dbg!("webpage connection");
    let (mut sender, mut receiver) = stream.split();
    let mut username = String::new();
    let name_uuid = Uuid::new_v4().simple().to_string();
    check_username(&state, &mut username, &name_uuid);
    let mut rx = state.tx.subscribe();
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            // In any websocket error, break loop.
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });
    let tx = state.tx.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            let _ = tx.send(format!("{}", text));
        }
    });
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}

fn check_username(state: &AppState, string: &mut String, name: &str) {
    let mut user_set = state.user_set.lock().unwrap();
    if !user_set.contains(name) {
        user_set.insert(name.to_owned());
        string.push_str(name);
    }
}

async fn index() -> Html<&'static str> {
    Html(std::include_str!("../html/index.html"))
}

async fn xstate() -> Html<&'static str> {
    Html(std::include_str!("../html/xstate.js"))
}

fn err_fn(err: cpal::StreamError) {
    eprintln!("an error occurred on stream: {}", err);
}
