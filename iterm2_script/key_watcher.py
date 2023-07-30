import asyncio
import iterm2
import websockets

async def main(connection):
    async with iterm2.KeystrokeMonitor(connection) as mon:
        while True:
            thekey = await mon.async_get()
            print(thekey)
            await sendit()

async def sendit():
    async with websockets.connect("ws://localhost:5757/ws") as websocket:
        await websocket.send('{ "type": "key", "value": "HIDDEN_FOR_SECURITY"}')
        await websocket.close()

iterm2.run_until_complete(main, True)

