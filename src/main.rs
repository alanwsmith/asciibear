#![allow(warnings)]
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
use nom::bytes::complete::tag_no_case;
use nom::bytes::complete::take_until;
use nom::bytes::complete::take_while_m_n;
use nom::character::complete::space0;
use nom::character::complete::space1;
use nom::combinator::map_res;
use nom::combinator::opt;
use nom::combinator::rest;
use nom::multi::many1;
use nom::sequence::tuple;
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
// use asciibear::connection::Connection;
// use asciibear::screen_capture::screen_capture;
use axum::response::Html;
use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::ClientConfig;
use twitch_irc::SecureTCPTransport;
use twitch_irc::TwitchIRCClient;
// use std::fmt::Display;
// use std::future::Future;
// use tokio::net::TcpListener;
// use tokio::sync::mpsc::UnboundedSender;
// use asciibear::helpers::spawn;
// use asciibear::stream_manager::start;
use std::collections::HashSet;

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
    // THESE WORK BUT ARE OFF RIGHT NOW UNTIL THE
    // WEB PAGE IS SETUP TO DEAL WITH THEM
    // let _rtmp_server = tokio::spawn(rtmp_server());
    // let _screen_capture = tokio::spawn(screen_capture(tx.clone()));
    let app_state = Arc::new(AppState { tx });
    let app = Router::new()
        //.nest_service("/", ServeDir::new("html"))
        .route("/", get(index))
        .route("/script.js", get(scriptjs))
        .route("/xstate.js", get(xstate))
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

// #[derive(Debug, PartialEq, Serialize, Deserialize)]
// pub struct Color {
//     pub red: u8,
//     pub green: u8,
//     pub blue: u8,
// }

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct TwitchBearShipment {
    key: Option<String>,
    value: Option<String>,
    // sender: Option<String>,
}

impl TwitchBearShipment {
    pub fn new() -> TwitchBearShipment {
        TwitchBearShipment {
            key: None,
            value: None,
            // sender: None,
        }
    }
}

pub fn assemble_twitch_message(payload: twitch_irc::message::PrivmsgMessage) -> Option<String> {
    let stuff = parse_incoming_twitch_message(payload.clone().message_text.as_str())
        .unwrap()
        .1;

    let mut tbs = TwitchBearShipment::new();
    // tbs.sender = Some(payload.clone().sender.name);

    match stuff {
        None => None,
        Some(junk) => match junk {
            TwitchCommand::None => None,
            // TwitchCommand::SayHi => {
            //     tbs.key = Some("sayhi".to_string());
            //     tbs.value = Some(format!("Hi {}!", payload.clone().sender.name));
            //     Some(serde_json::to_string(&tbs).unwrap())
            // }
        },
    }
}

// !bear head: some color, keys: some color
// !bear keys: asdf
// !bear palette: asdf

pub fn parse_incoming_twitch_message(source: &str) -> IResult<&str, Option<TwitchCommand>> {
    let (source, cmd) = opt(alt((
        bear_command,
        bear_command,
        // twitch_bear_body,
        // twitch_bear_head,
        // twitch_bear_keys,
        // twitch_bear_eyes,
        // twitch_bearbg_color
        // twitch_say_hi,
        // twitch_say_hi,
    )))(source)?;
    Ok((source, cmd))
}

async fn twitch_listener(tx: tokio::sync::broadcast::Sender<String>) {
    let config = ClientConfig::default();
    let (mut incoming_messages, client) =
        TwitchIRCClient::<SecureTCPTransport, StaticLoginCredentials>::new(config);
    let join_handle = tokio::spawn(async move {
        let mut said_hello_to: HashSet<String> = HashSet::new();
        while let Some(message) = incoming_messages.recv().await {
            match message {
                twitch_irc::message::ServerMessage::Privmsg(payload) => {
                    if !said_hello_to.contains(&payload.sender.name) {
                        said_hello_to.insert(payload.clone().sender.name);
                        let tbs = TwitchBearShipment {
                            key: Some("sayhi".to_string()),
                            value: Some(format!("Hi {}!", payload.clone().sender.name)),
                        };
                        let _ = tx.send(serde_json::to_string(&tbs).unwrap());
                    }

                    if let Some(msg) = assemble_twitch_message(payload) {
                        let _ = tx.send(msg);
                    }
                }
                _ => {}
            }
        }
    });
    client.join("theidofalan".to_owned()).unwrap();
    join_handle.await.unwrap();
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "key", content = "value", rename_all = "lowercase")]
pub enum TwitchCommand {
    // BearBody(Color),
    // BearHead(Color),
    // BearEyes(Color),
    // BearKeys(Color),
    // BearBgColor(Color),
    // SayHi,
    None,
}

// fn read_twitch(
//     source: &str,
//     payload: twitch_irc::message::PrivmsgMessage,
// ) -> IResult<&str, Option<TwitchCommand>> {
//     dbg!(payload);
//     let (source, cmd) = opt(alt((
//         bear_command,
//         bear_command,
//         // twitch_bear_body,
//         // twitch_bear_head,
//         // twitch_bear_keys,
//         // twitch_bear_eyes,
//         // twitch_bearbg_color
//         // twitch_say_hi,
//         // twitch_say_hi,
//     )))(source)?;
//     Ok((source, cmd))
// }

fn bear_command(source: &str) -> IResult<&str, TwitchCommand> {
    let (source, _) = tag_no_case("!bear")(source)?;
    let (source, _) = opt(tag(":"))(source)?;
    let (source, _) = space1(source)?;
    let (source, instructions) = many1(bear_instruction)(source)?;
    Ok(("", TwitchCommand::None))
}

// !bear eyes: asdf asdf, body: werwer,

fn bear_instruction(source: &str) -> IResult<&str, BearInstruction> {
    let (source, instruction) = tuple((
        alt((
            tag_no_case("head"),
            tag_no_case("body"),
            tag_no_case("eyes"),
            tag_no_case("keys"),
        )),
        tag(":"),
        space0,
        alt((take_until(","), rest)),
        opt(tag(",")),
    ))(source)?;

    dbg!(&instruction);

    Ok(("", BearInstruction::None))
}

pub enum BearInstruction {
    None,
}

// fn twitch_say_hi(source: &str) -> IResult<&str, TwitchCommand> {
//     Ok((source, TwitchCommand::SayHi))
// }

// fn twitch_bear_body(source: &str) -> IResult<&str, TwitchCommand> {
//     let (source, _) = tag("!body ")(source)?;
//     let (source, color) = hex_color(source)?;
//     Ok((source, TwitchCommand::BearBody(color)))
// }

// fn twitch_bear_head(source: &str) -> IResult<&str, TwitchCommand> {
//     let (source, _) = tag("!head ")(source)?;
//     let (source, color) = hex_color(source)?;
//     Ok((source, TwitchCommand::BearHead(color)))
// }

// fn twitch_bear_keys(source: &str) -> IResult<&str, TwitchCommand> {
//     let (source, _) = tag("!keys ")(source)?;
//     let (source, color) = hex_color(source)?;
//     Ok((source, TwitchCommand::BearKeys(color)))
// }

// fn twitch_bear_eyes(source: &str) -> IResult<&str, TwitchCommand> {
//     let (source, _) = tag("!eyes ")(source)?;
//     let (source, color) = hex_color(source)?;
//     Ok((source, TwitchCommand::BearEyes(color)))
// }

// fn twitch_bearbg_color(source: &str) -> IResult<&str, TwitchCommand> {
//     let (source, _) = tag("!bearbg ")(source)?;
//     let (source, color) = hex_color(source)?;
//     Ok((source, TwitchCommand::BearBgColor(color)))
// }

// fn from_hex(input: &str) -> Result<u8, std::num::ParseIntError> {
//     u8::from_str_radix(input, 16)
// }

// fn is_hex_digit(c: char) -> bool {
//     c.is_digit(16)
// }

// fn hex_primary(input: &str) -> IResult<&str, u8> {
//     map_res(take_while_m_n(2, 2, is_hex_digit), from_hex).parse(input)
// }

// fn hex_color(input: &str) -> IResult<&str, Color> {
//     let (input, _) = tag("#")(input)?;
//     let (input, (red, green, blue)) = (hex_primary, hex_primary, hex_primary).parse(input)?;
//     Ok((input, Color { red, green, blue }))
// }

fn err_fn(err: cpal::StreamError) {
    eprintln!("an error occurred on stream: {}", err);
}

// async fn rtmp_server() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
//     let manager_sender = start();
//     println!("Listening for connections on port 1935");
//     let listener = TcpListener::bind("0.0.0.0:1935").await?;
//     let mut current_id = 0;
//     loop {
//         let (stream, connection_info) = listener.accept().await?;
//         let connection = Connection::new(current_id, manager_sender.clone());
//         println!(
//             "Connection {}: Connection received from {}",
//             current_id,
//             connection_info.ip()
//         );
//         spawn(connection.start_handshake(stream));
//         current_id = current_id + 1;
//     }
// }
