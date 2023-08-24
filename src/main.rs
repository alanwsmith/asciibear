use axum::extract::ws::Message;
use axum::extract::ws::WebSocket;
use axum::extract::ws::WebSocketUpgrade;
use axum::extract::State;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use cpal::traits::DeviceTrait;
use cpal::traits::HostTrait;
use cpal::traits::StreamTrait;
use device_query::{DeviceEvents, DeviceState};
use futures::sink::SinkExt;
use futures::stream::StreamExt;
use nom::branch::alt;
use nom::bytes::complete::tag;
use nom::bytes::complete::take_while_m_n;
use nom::combinator::map_res;
use nom::combinator::opt;
use nom::sequence::Tuple;
use nom::IResult;
use nom::Parser;
use serde::Deserialize;
use serde::Serialize;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::broadcast;
// use tower_http::services::ServeDir;
// use tower_livereload::LiveReloadLayer;
use asciibear::connection::Connection;
use asciibear::screen_capture::screen_capture;
use axum::response::Html;
use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::ClientConfig;
use twitch_irc::SecureTCPTransport;
use twitch_irc::TwitchIRCClient;
// use std::fmt::Display;
// use std::future::Future;
use tokio::net::TcpListener;
// use tokio::sync::mpsc::UnboundedSender;
use asciibear::helpers::spawn;
use asciibear::stream_manager::start;

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
    let _rtmp_server = tokio::spawn(rtmp_server());
    let _screen_capture = tokio::spawn(screen_capture(tx.clone()));
    let app_state = Arc::new(AppState { tx });
    let app = Router::new()
        //.nest_service("/", ServeDir::new("html"))
        .route("/", get(index))
        .route("/script.js", get(scriptjs))
        .route("/xstate.js", get(xstate))
        .route("/test-position.html", get(position))
        .route("/bears.json", get(bears))
        .route("/ws", get(page_websocket_handler))
        // .layer(LiveReloadLayer::new())
        .with_state(app_state);
    let addr = SocketAddr::from(([127, 0, 0, 1], 3302));
    let _ = axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await;
}

async fn index() -> Html<&'static str> {
    Html(std::include_str!("../html/index.html"))
}

async fn scriptjs() -> Html<&'static str> {
    Html(std::include_str!("../html/script.js"))
}

async fn xstate() -> Html<&'static str> {
    Html(std::include_str!("../html/xstate.js"))
}

async fn position() -> Html<&'static str> {
    Html(std::include_str!("../html/test-position.html"))
}

async fn bears() -> Html<&'static str> {
    Html(std::include_str!("../html/bears.json"))
}

async fn key_watcher(tx: tokio::sync::broadcast::Sender<String>) {
    dbg!("key_watcher connection");
    let device_state = DeviceState::new();
    let _guard = device_state.on_key_down(move |_| {
        let payload = r#"{"key": "key", "value": "HIDDEN_FOR_SECURITY"}"#.to_string();
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
        let mut payload = r#"{"key": "dB", "value": "#.to_string();
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

#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "key", content = "value", rename_all = "lowercase")]
pub enum MouseSend {
    MouseMove(i32, i32),
}

async fn mouse_watcher(tx: tokio::sync::broadcast::Sender<String>) {
    dbg!("mouse_watcher connection");
    let device_state = DeviceState::new();
    let _guard = device_state.on_mouse_move(move |x| {
        let payload = MouseSend::MouseMove(x.0, x.1);
        let package = serde_json::to_string(&payload).unwrap();
        let _ = tx.send(package);
    });
    std::thread::sleep(std::time::Duration::from_secs(32536000));
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "key", content = "value", rename_all = "lowercase")]
pub enum TwitchCommand {
    BearColor(Color),
    BearBgColor(Color),
    None,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct Color {
    pub red: u8,
    pub green: u8,
    pub blue: u8,
}

async fn twitch_listener(tx: tokio::sync::broadcast::Sender<String>) {
    let config = ClientConfig::default();
    let (mut incoming_messages, client) =
        TwitchIRCClient::<SecureTCPTransport, StaticLoginCredentials>::new(config);
    let join_handle = tokio::spawn(async move {
        while let Some(message) = incoming_messages.recv().await {
            match message {
                twitch_irc::message::ServerMessage::Privmsg(payload) => {
                    // dbg!(&payload);
                    if let Some(msg) = read_twitch(payload.message_text.as_str()).unwrap().1 {
                        let shipment = serde_json::to_string(&msg).unwrap();
                        // dbg!(&shipment);
                        let _ = tx.send(shipment);
                    }
                }
                _ => {}
            }
        }
    });
    client.join("theidofalan".to_owned()).unwrap();
    join_handle.await.unwrap();
}

fn read_twitch(source: &str) -> IResult<&str, Option<TwitchCommand>> {
    let (source, cmd) = opt(alt((twitch_bear_color, twitch_bearbg_color)))(source)?;
    Ok((source, cmd))
}

fn twitch_bear_color(source: &str) -> IResult<&str, TwitchCommand> {
    let (source, _) = tag("!bear ")(source)?;
    let (source, color) = hex_color(source)?;
    Ok((source, TwitchCommand::BearColor(color)))
}

fn twitch_bearbg_color(source: &str) -> IResult<&str, TwitchCommand> {
    let (source, _) = tag("!bearbg ")(source)?;
    let (source, color) = hex_color(source)?;
    Ok((source, TwitchCommand::BearBgColor(color)))
}

fn from_hex(input: &str) -> Result<u8, std::num::ParseIntError> {
    u8::from_str_radix(input, 16)
}

fn is_hex_digit(c: char) -> bool {
    c.is_digit(16)
}

fn hex_primary(input: &str) -> IResult<&str, u8> {
    map_res(take_while_m_n(2, 2, is_hex_digit), from_hex).parse(input)
}

fn hex_color(input: &str) -> IResult<&str, Color> {
    let (input, _) = tag("#")(input)?;
    let (input, (red, green, blue)) = (hex_primary, hex_primary, hex_primary).parse(input)?;
    Ok((input, Color { red, green, blue }))
}

fn err_fn(err: cpal::StreamError) {
    eprintln!("an error occurred on stream: {}", err);
}

async fn rtmp_server() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let manager_sender = start();

    println!("Listening for connections on port 1935");
    let listener = TcpListener::bind("0.0.0.0:1935").await?;
    let mut current_id = 0;

    loop {
        let (stream, connection_info) = listener.accept().await?;

        let connection = Connection::new(current_id, manager_sender.clone());
        println!(
            "Connection {}: Connection received from {}",
            current_id,
            connection_info.ip()
        );

        spawn(connection.start_handshake(stream));
        current_id = current_id + 1;
    }
}
