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
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::broadcast;
use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::ClientConfig;
use twitch_irc::SecureTCPTransport;
use twitch_irc::TwitchIRCClient;

struct AppState {
    tx: broadcast::Sender<String>,
}

#[tokio::main]
async fn main() {
    let (tx, _rx) = broadcast::channel(100);
    let _mic_listener_handle = tokio::spawn(mic_listener(tx.clone()));
    let _key_watcher_handle = tokio::spawn(key_watcher(tx.clone()));
    let _mouse_watcher_handle = tokio::spawn(mouse_watcher(tx.clone()));
    let _twitch_handle = tokio::spawn(twitch_listener(tx.clone()));

    let app_state = Arc::new(AppState { tx });
    let app = Router::new()
        .route("/", get(index))
        .route("/xstate.js", get(xstate))
        .route("/ws", get(page_websocket_handler))
        .with_state(app_state);
    let addr = SocketAddr::from(([127, 0, 0, 1], 5757));
    let _ = axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await;
}

async fn key_watcher(tx: tokio::sync::broadcast::Sender<String>) {
    dbg!("key_watcher connection");
    let device_state = DeviceState::new();
    let _guard = device_state.on_key_down(move |_| {
        let payload = r#"{"type": "key", "value": "HIDDEN_FOR_SECURITY"}"#.to_string();
        let _ = tx.send(payload);
    });
    std::thread::sleep(std::time::Duration::from_secs(32536000));
}

async fn mic_listener(tx: tokio::sync::broadcast::Sender<String>) {
    dbg!("mic_listener connection");
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
    std::thread::sleep(std::time::Duration::from_secs(32536000));
}

async fn page_websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| page_websocket(socket, state))
}

async fn page_websocket(stream: WebSocket, state: Arc<AppState>) {
    dbg!("page_websocket connection");
    let (mut sender, mut _receiver) = stream.split();
    let mut rx = state.tx.subscribe();
    let _send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });
}

async fn mouse_watcher(tx: tokio::sync::broadcast::Sender<String>) {
    dbg!("mouse_watcher connection");
    let device_state = DeviceState::new();
    let _guard = device_state.on_mouse_move(move |_| {
        let payload = r#"{"type": "mouse", "value": "move"}"#.to_string();
        let _ = tx.send(payload);
    });
    std::thread::sleep(std::time::Duration::from_secs(32536000));
}

async fn twitch_listener(tx: tokio::sync::broadcast::Sender<String>) {
    let config = ClientConfig::default();
    let (mut incoming_messages, client) =
        TwitchIRCClient::<SecureTCPTransport, StaticLoginCredentials>::new(config);
    let join_handle = tokio::spawn(async move {
        while let Some(message) = incoming_messages.recv().await {
            dbg!(&message);
            match message {
                twitch_irc::message::ServerMessage::Privmsg(payload) => {
                    println!("{}\n{}\n", payload.sender.name, payload.message_text);
                    let payload = r#"{"type": "chat", "value": "move"}"#.to_string();
                    let _ = tx.send(payload);
                }
                _ => {}
            }
        }
    });
    client.join("theidofalan".to_owned()).unwrap();
    join_handle.await.unwrap();
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
