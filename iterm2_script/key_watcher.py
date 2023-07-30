import asyncio
import iterm2
import websockets

async def main(connection):
    async with iterm2.KeystrokeMonitor(connection) as mon:
        async for websocket in websockets.connect("ws://127.0.0.1:5757/ws"):
            try:
                while True:
                    await mon.async_get()
                    await websocket.send('{ "type": "key", "value": "HIDDEN_FOR_SECURITY"}')
            except websockets.ConnectionClosed:
                continue

iterm2.run_until_complete(main, True)
